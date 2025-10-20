import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { errorService, ErrorEntry } from '../utils/errorService';

// Styled Components
const ErrorContainer = styled.div`
  margin-top: 12px;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 13px;
  text-align: center;
  min-height: 20px;
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  display: block;
  flex-shrink: 0;
`;

const ErrorHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const ErrorMessage = styled.div`
  font-weight: 500;
  flex: 1;
  text-align: left;
`;

const ErrorActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const ErrorButton = styled.button`
  padding: 4px 8px;
  border: 1px solid #721c24;
  border-radius: 3px;
  background-color: transparent;
  color: #721c24;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: #721c24;
    color: white;
  }

  &:active {
    transform: translateY(1px);
  }
`;

const ErrorDetails = styled.div<{ $expanded: boolean }>`
  max-height: ${props => props.$expanded ? '300px' : '0'};
  overflow: hidden;
  transition: max-height 0.3s ease;
  margin-top: 8px;
  border-top: 1px solid #f5c6cb;
  padding-top: 8px;
`;

const ErrorList = styled.div`
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #f5c6cb;
  border-radius: 3px;
  background-color: #fefefe;
`;

const ErrorItem = styled.div`
  padding: 8px;
  border-bottom: 1px solid #f5c6cb;
  font-size: 12px;

  &:last-child {
    border-bottom: none;
  }
`;

const ErrorItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
`;

const ErrorItemComponent = styled.span`
  font-weight: bold;
  color: #721c24;
`;

const ErrorItemTime = styled.span`
  color: #666;
  font-size: 11px;
`;

const ErrorItemMessage = styled.div`
  color: #333;
  margin-bottom: 4px;
`;

const ErrorItemStack = styled.pre`
  background-color: #f8f9fa;
  padding: 6px;
  border-radius: 3px;
  font-size: 10px;
  color: #666;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 100px;
  overflow-y: auto;
  margin: 0;
`;

const ErrorItemActions = styled.div`
  display: flex;
  gap: 4px;
  margin-top: 4px;
`;

const ErrorItemButton = styled.button`
  padding: 2px 6px;
  border: 1px solid #ccc;
  border-radius: 2px;
  background-color: transparent;
  color: #666;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: #f0f0f0;
  }
`;

const NoErrorsMessage = styled.div`
  padding: 16px;
  text-align: center;
  color: #666;
  font-style: italic;
`;

interface ErrorDisplayProps {
  className?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ className }) => {
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Load initial errors
    setErrors(errorService.getErrors());

    // Subscribe to error updates
    const unsubscribe = errorService.subscribe((newErrors) => {
      setErrors(newErrors);
    });

    return unsubscribe;
  }, []);

  const latestError = errors.length > 0 ? errors[0] : null;

  const handleClearAll = () => {
    errorService.clearErrors();
  };

  const handleClearError = (id: string) => {
    errorService.clearErrorById(id);
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDate = (timestamp: Date) => {
    return new Date(timestamp).toLocaleDateString();
  };

  if (!latestError) {
    return null; // Don't show anything if there are no errors
  }

  return (
    <ErrorContainer className={className}>
      <ErrorHeader>
        <ErrorMessage>
          {latestError.component}: {latestError.message}
        </ErrorMessage>
        <ErrorActions>
          <ErrorButton onClick={() => setShowDetails(!showDetails)}>
            {showDetails ? 'Hide' : 'Details'}
          </ErrorButton>
          {errors.length > 1 && (
            <ErrorButton onClick={handleClearAll}>
              Clear All ({errors.length})
            </ErrorButton>
          )}
        </ErrorActions>
      </ErrorHeader>

      <ErrorDetails $expanded={showDetails}>
        <ErrorList>
          {errors.length === 0 ? (
            <NoErrorsMessage>No errors to display</NoErrorsMessage>
          ) : (
            errors.map((error) => (
              <ErrorItem key={error.id}>
                <ErrorItemHeader>
                  <ErrorItemComponent>{error.component}</ErrorItemComponent>
                  <ErrorItemTime>
                    {formatDate(error.timestamp)} {formatTime(error.timestamp)}
                  </ErrorItemTime>
                </ErrorItemHeader>
                <ErrorItemMessage>{error.message}</ErrorItemMessage>
                {error.stack && (
                  <ErrorItemStack>{error.stack}</ErrorItemStack>
                )}
                <ErrorItemActions>
                  <ErrorItemButton onClick={() => handleClearError(error.id)}>
                    Clear
                  </ErrorItemButton>
                  {error.url && (
                    <ErrorItemButton 
                      onClick={() => window.open(error.url, '_blank')}
                      title="Open URL where error occurred"
                    >
                      View URL
                    </ErrorItemButton>
                  )}
                </ErrorItemActions>
              </ErrorItem>
            ))
          )}
        </ErrorList>
      </ErrorDetails>
    </ErrorContainer>
  );
};

export default ErrorDisplay;
