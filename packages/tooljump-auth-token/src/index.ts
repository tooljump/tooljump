import { Auth } from "@tooljump/common";
import { Logger } from "@tooljump/logger";
import { timingSafeEqual } from "crypto";

export interface TokenAuthConfig {
  logger: Logger;
  token: string;
}

export class TokenAuth extends Auth {
    private token: string;

    constructor(config: TokenAuthConfig) {
        super(config.logger); // HasLogger automatically creates child with component: 'tokenauth'
        
        if (!config.token) {
            this.logger.warn({
                operation: 'initialize',
                issue: 'missing-token'
            }, 'Token is required');
            throw new Error('Token is required');
        }

        // Validate token strength
        this.validateTokenStrength(config.token);
        
        this.token = config.token;
        
        // Bind the middleware method to preserve 'this' context
        this.middleware = this.middleware.bind(this);
        
        this.logger.debug({
            operation: 'initialize'
        }, 'TokenAuth initialized successfully');
    }

    private validateTokenStrength(token: string): void {
        if (token.length < 8) {
            this.logger.warn({
                operation: 'token-validation',
                issue: 'too-short'
            }, 'Token must be at least 8 characters long');
            throw new Error('Token must be at least 8 characters long');
        }

        const hasUpperCase = /[A-Z]/.test(token);
        const hasLowerCase = /[a-z]/.test(token);
        const hasNumber = /[0-9]/.test(token);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(token);

        if (!hasUpperCase) {
            this.logger.warn({
                operation: 'token-validation',
                issue: 'missing-uppercase'
            }, 'Token must contain at least one uppercase letter');
            throw new Error('Token must contain at least one uppercase letter');
        }

        if (!hasLowerCase) {
            this.logger.warn({
                operation: 'token-validation',
                issue: 'missing-lowercase'
            }, 'Token must contain at least one lowercase letter');
            throw new Error('Token must contain at least one lowercase letter');
        }

        if (!hasNumber) {
            this.logger.warn({
                operation: 'token-validation',
                issue: 'missing-number'
            }, 'Token must contain at least one number');
            throw new Error('Token must contain at least one number');
        }

        if (!hasSpecialChar) {
            this.logger.warn({
                operation: 'token-validation',
                issue: 'missing-special-char'
            }, 'Token must contain at least one special character');
            throw new Error('Token must contain at least one special character');
        }

        this.logger.debug({
            operation: 'token-validation',
            result: 'success'
        }, 'Token strength validation passed');
    }

    async middleware(req: any, res: any, next: any): Promise<void> {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            this.logger.warn({
                operation: 'auth-check',
                issue: 'missing-header'
            }, 'No authorization header provided');
            return res.status(401).json({ error: 'Authorization header required' });
        }

        const [bearer, token] = authHeader.split(' ');
        
        if (bearer !== 'Bearer' || !token) {
            this.logger.warn({
                operation: 'auth-check',
                issue: 'invalid-format',
                authHeader: authHeader.substring(0, 20) + '...'
            }, 'Invalid authorization header format');
            return res.status(401).json({ error: 'Invalid authorization header format' });
        }

        // Use constant-time comparison to prevent timing attacks
        try {
            const tokenBuffer = Buffer.from(token, 'utf8');
            const expectedBuffer = Buffer.from(this.token, 'utf8');
            
            // Ensure both buffers are the same length to use timingSafeEqual
            if (tokenBuffer.length !== expectedBuffer.length) {
                this.logger.warn({
                    operation: 'auth-check',
                    issue: 'invalid-token',
                    providedToken: token.substring(0, 4) + '...'
                }, 'Invalid token provided');
                return res.status(401).json({ error: 'Invalid token' });
            }
            
            if (!timingSafeEqual(tokenBuffer, expectedBuffer)) {
                this.logger.warn({
                    operation: 'auth-check',
                    issue: 'invalid-token',
                    providedToken: token.substring(0, 4) + '...'
                }, 'Invalid token provided');
                return res.status(401).json({ error: 'Invalid token' });
            }
        } catch (error) {
            this.logger.warn({
                operation: 'auth-check',
                issue: 'token-comparison-error'
            }, 'Error during token comparison');
            return res.status(401).json({ error: 'Invalid token' });
        }

        this.logger.debug({
            operation: 'auth-check',
            result: 'success'
        }, 'Token authentication successful');
        
        next();
    }
}
