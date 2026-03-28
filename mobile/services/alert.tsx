import { createContext, useCallback, useContext, useState } from 'react';
import { View } from 'react-native';
import CustomAlert, { AlertConfig, AlertButton } from '../components/CustomAlert';

interface AlertContextType {
  showAlert: (config: AlertConfig) => void;
}

const AlertContext = createContext<AlertContextType>({
  showAlert: () => {},
});

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertConfig>({ title: '', message: '' });

  const showAlert = useCallback((alertConfig: AlertConfig) => {
    setConfig(alertConfig);
    setVisible(true);
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert }}>
      <View style={{ flex: 1 }}>
        {children}
        <CustomAlert
          visible={visible}
          config={config}
          onDismiss={() => setVisible(false)}
        />
      </View>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  return useContext(AlertContext);
}
