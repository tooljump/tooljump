import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { logger } from '../utils/logger';
import { setIconFromContentScript } from '../utils/iconMessaging';
import ErrorDisplay from './ErrorDisplay';
import floating from './img/floating.png';
import integrated from './img/integrated.png';
import { CONFIG } from '../config';

// Styled Components
const PopupContainer = styled.div`
  width: 350px;
  height: 500px;
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
`;

const TitleContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const Title = styled.h1`
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
`;

const HelpIcon = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 12px;
  border: 2px solid #3498db;
  background-color: white;
  color: #3498db;
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #3498db;
    color: white;
    transform: scale(1.05);
  }
  
  &:active {
    transform: scale(0.98);
  }
`;

const QuestionCircle = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: #3498db;
  color: white;
  font-size: 12px;
  font-weight: bold;
  
  ${HelpIcon}:hover & {
    background-color: white;
    color: #3498db;
  }
`;

// Tab Components
const TabContainer = styled.div`
  display: flex;
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e1e8ed;
  flex-shrink: 0;
`;

const Tab = styled.button<{ $active?: boolean }>`
  flex: 1;
  padding: 12px 8px;
  border: none;
  background-color: ${props => props.$active ? '#0f2a3d' : '#f8f9fa'};
  color: ${props => props.$active ? 'white' : '#6c757d'};
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.$active ? '#2980b9' : '#e9ecef'};
  }

  &:first-child {
    border-top-left-radius: 8px;
    border-bottom-left-radius: 8px;
  }

  &:last-child {
    border-top-right-radius: 8px;
    border-bottom-right-radius: 8px;
  }
`;

const TabIcon = styled.div`
  font-size: 16px;
  line-height: 1;
`;

const TabLabel = styled.span`
  font-size: 11px;
  line-height: 1;
`;

// Tab Content
const TabContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
  margin-bottom: 20px;
`;

const TabContentFooter = styled.div`
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid #eee;
`;

// Form Components
const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 6px;
  color: #555;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }

  &::placeholder {
    color: #999;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: ${props => props.$variant === 'primary' ? '#0f2a3d' : '#95a5a6'};
  color: white;

  &:hover {
    background-color: ${props => props.$variant === 'primary' ? '#2f4c5f' : '#7f8c8d'};
  }

  &:active {
    transform: translateY(1px);
  }
`;

const StatusMessage = styled.div<{ type?: 'success' | 'error' | 'hidden' }>`
  margin-top: 12px;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 13px;
  text-align: center;
  min-height: 20px;
  background-color: ${props => {
    if (props.type === 'success') return '#d4edda';
    if (props.type === 'error') return '#f8d7da';
    return 'transparent';
  }};
  color: ${props => {
    if (props.type === 'success') return '#155724';
    if (props.type === 'error') return '#721c24';
    return 'transparent';
  }};
  border: 1px solid ${props => {
    if (props.type === 'success') return '#c3e6cb';
    if (props.type === 'error') return '#f5c6cb';
    return 'transparent';
  }};
  display: ${props => props.type === 'hidden' ? 'none' : 'block'};
  flex-shrink: 0;
`;

const RadioGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
`;

const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 4px 0;

  input[type="radio"] {
    margin-right: 8px;
    cursor: pointer;
  }
`;

const RadioText = styled.span`
  font-size: 14px;
  color: #333;
`;

const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #2c3e50;
`;

const ProvidersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ProviderItem = styled.div<{ disabled?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eee;
  color: ${props => props.disabled ? '#999' : 'inherit'};
  background-color: ${props => props.disabled ? '#f9f9f9' : 'transparent'};

  &:last-child {
    border-bottom: none;
  }
`;

const ProviderName = styled.div`
  font-weight: bold;
`;

const ProviderDescription = styled.div`
  font-size: 0.9em;
  color: #666;
  margin-top: 4px;
`;

const ProviderError = styled.div`
  padding: 10px;
  color: #d8000c;
  background-color: #ffbaba;
  border: 1px solid #d8000c;
  border-radius: 4px;
`;

// Toggle Switch Components
const Switch = styled.label`
  position: relative;
  display: inline-block;
  width: 40px;
  height: 22px;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }
`;

const Slider = styled.span<{ checked?: boolean }>`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${props => props.checked ? '#2196F3' : '#ccc'};
  transition: .4s;
  border-radius: 22px;

  &:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 2px;
    bottom: 2px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
    transform: ${props => props.checked ? 'translateX(18px)' : 'translateX(0)'};
  }

  &:focus {
    box-shadow: 0 0 1px #2196F3;
  }
`;

// Types
interface Settings {
  host?: string;
  secureToken?: string;
  displayMode?: string;
  debugShowContext?: boolean;
  debugMode?: boolean;
  demoMode?: boolean;
}

interface Adapter {
  name: string;
  description: string;
  enabled: boolean;
}

interface Config {
  adapters: Adapter[];
  customDomains: string[];
}

type TabType = 'connection' | 'display' | 'providers' | 'debug';

// Extracted Tab Components (defined outside to avoid remounting on each render)
interface ConnectionTabProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  onSave: () => void;
  onClose: () => void;
}

const ConnectionTabComponent: React.FC<ConnectionTabProps> = ({ settings, setSettings, onSave, onClose }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <FormGroup>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Switch>
            <input
              type="checkbox"
              id="demo-mode"
              checked={settings.demoMode || false}
              onChange={(e) => setSettings(prev => ({ ...prev, demoMode: e.target.checked }))}
            />
            <Slider checked={settings.demoMode || false} />
          </Switch>
          <Label htmlFor="demo-mode" style={{ margin: 0, cursor: 'pointer' }}>
            Demo Mode
          </Label>
        </div>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
          Show demo data instead of requiring a server to be set up. Only works on <a style={{ color: '#888', textDecoration: 'underline' }} href={`https://github.com/${CONFIG.demoRepo}`} target="_blank" rel="noopener noreferrer">github.com/{CONFIG.demoRepo}</a>
        </div>
      </FormGroup>
      
      <FormGroup>
        <Label htmlFor="host">Host:</Label>
        <Input
          type="text"
          id="host"
          placeholder="Enter host URL"
          value={settings.host || ''}
          onChange={(e) => setSettings(prev => ({ ...prev, host: e.target.value }))}
          disabled={settings.demoMode || false}
          style={{ 
            opacity: settings.demoMode ? 0.5 : 1,
            cursor: settings.demoMode ? 'not-allowed' : 'text'
          }}
        />
      </FormGroup>
      
      <FormGroup>
        <Label htmlFor="secure-token">Secure Token:</Label>
        <Input
          type="text"
          id="secure-token"
          placeholder="Enter secure token"
          value={settings.secureToken || ''}
          onChange={(e) => setSettings(prev => ({ ...prev, secureToken: e.target.value }))}
          disabled={settings.demoMode || false}
          style={{ 
            opacity: settings.demoMode ? 0.5 : 1,
            cursor: settings.demoMode ? 'not-allowed' : 'text'
          }}
        />
      </FormGroup>
    </div>
    
    <TabContentFooter>
      <ButtonGroup>
        <Button type="button" $variant="primary" onClick={onSave}>Save</Button>
        <Button type="button" $variant="secondary" onClick={onClose}>Close</Button>
      </ButtonGroup>
    </TabContentFooter>
  </div>
);

interface DisplayTabProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  onSave: () => void;
  onClose: () => void;
}

const DisplayTabComponent: React.FC<DisplayTabProps> = ({ settings, setSettings, onSave, onClose }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <div style={{ flex: 1 }}>
      <FormGroup>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '26px' }}>
          <div 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              cursor: 'pointer',
              borderRadius: '8px',
              backgroundColor: settings.displayMode === 'integrated' ? '#f8f9fa' : 'transparent',
              transition: 'all 0.2s ease'
            }}
            onClick={() => setSettings(prev => ({ ...prev, displayMode: 'integrated' }))}
          >
            <img 
              src={integrated} 
              alt="Integrated Bar" 
              style={{ 
                width: '139px', 
                height: '92px', 
                objectFit: 'cover',
                borderRadius: '4px',
                border: settings.displayMode === 'integrated' ? '2px solid #3498db' : '1px solid #ddd'
              }} 
            />
            <span style={{ 
              marginTop: '8px', 
              fontSize: '14px', 
              fontWeight: '500',
              color: '#333',
              textAlign: 'center'
            }}>
              Integrated Bar
            </span>
            <span style={{ 
              marginTop: '4px', 
              fontSize: '12px', 
              color: '#666',
              textAlign: 'center',
              lineHeight: '1.3'
            }}>
              Show the bar on the top of the page, integrated with the page
            </span>
          </div>
          
          <div 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              cursor: 'pointer',
              borderRadius: '8px',
              backgroundColor: settings.displayMode === 'floating' ? '#f8f9fa' : 'transparent',
              transition: 'all 0.2s ease'
            }}
            onClick={() => setSettings(prev => ({ ...prev, displayMode: 'floating' }))}
          >
            <img 
              src={floating} 
              alt="Floating Button" 
              style={{ 
                width: '139px', 
                height: '92px', 
                objectFit: 'cover',
                borderRadius: '4px',
                border: settings.displayMode === 'floating' ? '2px solid #3498db' : '1px solid #ddd'
              }} 
            />
            <span style={{ 
              marginTop: '8px', 
              fontSize: '14px', 
              fontWeight: '500',
              color: '#333',
              textAlign: 'center'
            }}>
              Floating Button
            </span>
            <span style={{ 
              marginTop: '4px', 
              fontSize: '12px', 
              color: '#666',
              textAlign: 'center',
              lineHeight: '1.3'
            }}>
              Show it as a floating button, collapsible to show the content
            </span>
          </div>
        </div>
      </FormGroup>
    </div>
    
    <TabContentFooter>
      <ButtonGroup>
        <Button type="button" $variant="primary" onClick={onSave}>Save</Button>
        <Button type="button" $variant="secondary" onClick={onClose}>Close</Button>
      </ButtonGroup>
    </TabContentFooter>
  </div>
);

interface ProvidersTabProps {
  config: Config | null;
  settings: Settings;
  customDomainPermissions: Record<string, boolean>;
  onToggleCustomDomain: (domain: string, enabled: boolean) => void;
  onSave: () => void;
  onClose: () => void;
}

const ProvidersTabComponent: React.FC<ProvidersTabProps> = ({ config, settings, customDomainPermissions, onToggleCustomDomain, onSave, onClose }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <SectionTitle>Available Providers</SectionTitle>
      <ProvidersList>
        {config ? (
          config.adapters
            .filter(adapter => adapter.name !== 'generic')
            .map(adapter => (
              <ProviderItem key={adapter.name} disabled={!adapter.enabled}>
                <div>
                  <ProviderName>{adapter.name}</ProviderName>
                  <ProviderDescription>{adapter.description}</ProviderDescription>
                </div>
              </ProviderItem>
            ))
        ) : settings.host ? (
          <ProviderError>Loading providers...</ProviderError>
        ) : (
          <ProviderError>Please configure the host URL first</ProviderError>
        )}
      </ProvidersList>
      
      {config?.customDomains && config.customDomains.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <SectionTitle>Custom Integrations</SectionTitle>
          <ProvidersList>
            {config.customDomains.map(domain => (
              <ProviderItem key={domain}>
                <ProviderName>{new URL(domain).hostname}</ProviderName>
                <Switch>
                  <input
                    type="checkbox"
                    checked={customDomainPermissions[domain] || false}
                    onChange={(e) => onToggleCustomDomain(domain, e.target.checked)}
                  />
                  <Slider checked={customDomainPermissions[domain] || false} />
                </Switch>
              </ProviderItem>
            ))}
          </ProvidersList>
        </div>
      )}
    </div>
    
    <TabContentFooter>
      <ButtonGroup>
        <Button type="button" $variant="primary" onClick={onSave}>Save</Button>
        <Button type="button" $variant="secondary" onClick={onClose}>Close</Button>
      </ButtonGroup>
    </TabContentFooter>
  </div>
);

interface DebugTabProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  onSave: () => void;
  onClose: () => void;
}

const DebugTabComponent: React.FC<DebugTabProps> = ({ settings, setSettings, onSave, onClose }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <div style={{ flex: 1 }}>
      <SectionTitle>Debug Options</SectionTitle>
      <ProvidersList>
        <ProviderItem>
          <div>
            <ProviderName>Show Context Overlay</ProviderName>
            <ProviderDescription>Display the current context information in a draggable overlay</ProviderDescription>
          </div>
          <Switch>
            <input
              type="checkbox"
              checked={settings.debugShowContext || false}
              onChange={(e) => setSettings(prev => ({ ...prev, debugShowContext: e.target.checked }))}
            />
            <Slider checked={settings.debugShowContext || false} />
          </Switch>
        </ProviderItem>
        
        <ProviderItem>
          <div>
            <ProviderName>Enable Debug Logging</ProviderName>
            <ProviderDescription>Shows detailed logs in browser console for troubleshooting</ProviderDescription>
          </div>
          <Switch>
            <input
              type="checkbox"
              checked={settings.debugMode || false}
              onChange={(e) => setSettings(prev => ({ ...prev, debugMode: e.target.checked }))}
            />
            <Slider checked={settings.debugMode || false} />
          </Switch>
        </ProviderItem>
      </ProvidersList>
    </div>
    
    <TabContentFooter>
      <ButtonGroup>
        <Button type="button" $variant="primary" onClick={onSave}>Save</Button>
        <Button type="button" $variant="secondary" onClick={onClose}>Close</Button>
      </ButtonGroup>
    </TabContentFooter>
  </div>
);

// Main Popup Component
const Popup: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('connection');
  const [settings, setSettings] = useState<Settings>({});
  const [config, setConfig] = useState<Config | null>(null);
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | 'hidden' }>({
    message: '',
    type: 'hidden'
  });
  const [customDomainPermissions, setCustomDomainPermissions] = useState<Record<string, boolean>>({});
  const [settingsLoaded, setSettingsLoaded] = useState<boolean>(false);

  // Load settings from Chrome storage
  useEffect(() => {
    chrome.storage.local.get(['host', 'secureToken', 'displayMode', 'debugShowContext', 'debugMode', 'demoMode'], (result: Settings) => {
      setSettings({
        host: result.host || '',
        secureToken: result.secureToken || '',
        displayMode: result.displayMode || 'integrated',
        debugShowContext: result.debugShowContext || false,
        debugMode: result.debugMode || false,
        demoMode: result.demoMode !== undefined ? result.demoMode : true // Default to enabled
      });
      setSettingsLoaded(true);
    });
    
    // Set default icon (red) when popup loads
    setIconFromContentScript('red');
  }, []);

  // Load configuration from server once after settings load (skip typing-triggered changes and demo mode)
  useEffect(() => {
    if (settingsLoaded && settings.host && !settings.demoMode) {
      loadConfig();
    }
  }, [settingsLoaded, settings.demoMode]);

  const loadConfig = async () => {
    try {
      const url = `${settings.host}/config`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (settings.secureToken) {
        headers['Authorization'] = `Bearer ${settings.secureToken}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: Config = await response.json();
      setConfig(data);
      
      // Load custom domain permissions
      await loadCustomDomainPermissions(data.customDomains);
      
      setIconFromContentScript('green');
      setStatus({
        message: 'Configuration loaded successfully!',
        type: 'success'
      });
    } catch (error) {
      setIconFromContentScript('red');
      logger.error('Popup', `Error loading configuration from the ToolJump server. Make sure your server ${settings.host} and the secure token is correct.`, error);
      // Error will be automatically displayed by ErrorDisplay component
    }
  };

  const loadCustomDomainPermissions = async (customDomains: string[]) => {
    const permissions: Record<string, boolean> = {};
    
    for (const domain of customDomains) {
      const origin = `${domain}/*`;
      try {
        const hasPermission = await new Promise<boolean>((resolve, reject) => {
          chrome.permissions.contains({ origins: [origin] }, (result) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(result);
            }
          });
        });
        permissions[domain] = hasPermission;
      } catch (error) {
        logger.error('Popup', `Error checking permission for ${origin}`, error);
        permissions[domain] = false;
      }
    }
    
    setCustomDomainPermissions(permissions);
  };

  const handleSaveSettings = () => {
    const newSettings = {
      host: settings.host?.trim() || '',
      secureToken: settings.secureToken?.trim() || '',
      displayMode: settings.displayMode || 'integrated',
      debugShowContext: settings.debugShowContext || false,
      debugMode: settings.debugMode || false,
      demoMode: settings.demoMode || false
    };

    chrome.storage.local.set(newSettings, () => {
      if (chrome.runtime.lastError) {
        setStatus({
          message: 'Error saving settings: ' + chrome.runtime.lastError.message,
          type: 'error'
        });
      } else {
        setStatus({
          message: 'Settings saved successfully! Refreshing page...',
          type: 'success'
        });
        
        // Reload configuration after saving settings (skip in demo mode)
        if (!newSettings.demoMode && newSettings.host) {
          loadConfig();
        }
        
        // Auto-close after 1 second and refresh the current page
        setTimeout(() => {
          chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0] && tabs[0].id) {
              chrome.tabs.reload(tabs[0].id);
            }
          });
          window.close();
        }, 1000);
      }
    });
  };

  const handleClose = () => {
    window.close();
  };

  const handleCustomDomainToggle = async (domain: string, enabled: boolean) => {
    const origin = `${domain}/*`;
    
    if (enabled) {
      // Request permission
      const granted = await new Promise<boolean>(resolve => 
        chrome.permissions.request({ origins: [origin] }, resolve)
      );
      
      if (granted) {
        setStatus({
          message: `Permission granted for ${domain}`,
          type: 'success'
        });
        
        // Reload tabs with this origin
        chrome.tabs.query({ url: origin }, (tabs) => {
          for (const tab of tabs) {
            if (tab.id) {
              chrome.tabs.reload(tab.id);
            }
          }
        });
        
        setCustomDomainPermissions(prev => ({ ...prev, [domain]: true }));
      } else {
        setStatus({
          message: `Permission denied for ${domain}`,
          type: 'error'
        });
      }
    } else {
      // Remove permission
      const removed = await new Promise<boolean>(resolve => 
        chrome.permissions.remove({ origins: [origin] }, (result) => {
          resolve(result);
        })
      );
      
      if (removed) {
        setStatus({
          message: `Permission removed for ${domain}`,
          type: 'success'
        });
        setCustomDomainPermissions(prev => ({ ...prev, [domain]: false }));
      } else {
        setStatus({
          message: `Failed to remove permission for ${domain}`,
          type: 'error'
        });
      }
    }
  };

  const showStatus = (message: string, type: 'success' | 'error') => {
    setStatus({ message, type });
    setTimeout(() => {
      setStatus(prev => ({ ...prev, type: 'hidden' }));
    }, 3000);
  };

  // Tab content renderer

  const renderTabContent = () => {
    switch (activeTab) {
      case 'connection':
        return (
          <ConnectionTabComponent 
            settings={settings}
            setSettings={setSettings}
            onSave={handleSaveSettings}
            onClose={handleClose}
          />
        );
      case 'display':
        return (
          <DisplayTabComponent 
            settings={settings}
            setSettings={setSettings}
            onSave={handleSaveSettings}
            onClose={handleClose}
          />
        );
      case 'providers':
        return (
          <ProvidersTabComponent 
            config={config}
            settings={settings}
            customDomainPermissions={customDomainPermissions}
            onToggleCustomDomain={handleCustomDomainToggle}
            onSave={handleSaveSettings}
            onClose={handleClose}
          />
        );
      case 'debug':
        return (
          <DebugTabComponent 
            settings={settings}
            setSettings={setSettings}
            onSave={handleSaveSettings}
            onClose={handleClose}
          />
        );
      default:
        return (
          <ConnectionTabComponent 
            settings={settings}
            setSettings={setSettings}
            onSave={handleSaveSettings}
            onClose={handleClose}
          />
        );
    }
  };

  return (
    <PopupContainer>
      <TitleContainer>
        <Title>ToolJump Settings</Title>
        <HelpIcon 
          href="https://tooljump.dev/docs/getting-started" 
          target="_blank" 
          rel="noopener noreferrer"
          title="Open documentation"
        >
          <QuestionCircle>?</QuestionCircle>
          <span>docs</span>
        </HelpIcon>
      </TitleContainer>
      
      <TabContainer>
        <Tab 
          $active={activeTab === 'connection'} 
          onClick={() => setActiveTab('connection')}
        >
          <TabIcon>🔗</TabIcon>
          <TabLabel>Connection</TabLabel>
        </Tab>
        <Tab 
          $active={activeTab === 'display'} 
          onClick={() => setActiveTab('display')}
        >
          <TabIcon>🖥️</TabIcon>
          <TabLabel>Display</TabLabel>
        </Tab>
        <Tab 
          $active={activeTab === 'providers'} 
          onClick={() => setActiveTab('providers')}
        >
          <TabIcon>🧩</TabIcon>
          <TabLabel>Providers</TabLabel>
        </Tab>
        <Tab 
          $active={activeTab === 'debug'} 
          onClick={() => setActiveTab('debug')}
        >
          <TabIcon>⚙️</TabIcon>
          <TabLabel>Debug</TabLabel>
        </Tab>
      </TabContainer>
      
      <TabContent>
        {renderTabContent()}
      </TabContent>
      
      <ErrorDisplay />
      <StatusMessage type={status.type}>{status.message}</StatusMessage>
    </PopupContainer>
  );
};

export default Popup; 