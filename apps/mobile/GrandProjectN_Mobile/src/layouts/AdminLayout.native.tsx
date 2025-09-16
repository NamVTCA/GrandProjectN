import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  Dimensions 
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

// Placeholder components - replace with your actual admin screens
function DashboardScreen() {
  return (
    <View style={styles.screenContainer}>
      <Text>Bảng điều khiển</Text>
    </View>
  );
}

function UsersScreen() {
  return (
    <View style={styles.screenContainer}>
      <Text>Quản lý Người dùng</Text>
    </View>
  );
}

function ContentScreen() {
  return (
    <View style={styles.screenContainer}>
      <Text>Quản lý Nội dung</Text>
    </View>
  );
}

function TransactionsScreen() {
  return (
    <View style={styles.screenContainer}>
      <Text>Quản lý Giao dịch</Text>
    </View>
  );
}

type AdminScreen = 'Dashboard' | 'Users' | 'Content' | 'Transactions';

const AdminLayout: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AdminScreen>('Dashboard');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Dashboard':
        return <DashboardScreen />;
      case 'Users':
        return <UsersScreen />;
      case 'Content':
        return <ContentScreen />;
      case 'Transactions':
        return <TransactionsScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  const menuItems = [
    { name: 'Dashboard' as AdminScreen, label: 'Bảng điều khiển', icon: 'tachometer-alt' },
    { name: 'Users' as AdminScreen, label: 'Quản lý Người dùng', icon: 'users' },
    { name: 'Content' as AdminScreen, label: 'Quản lý Nội dung', icon: 'edit' },
    { name: 'Transactions' as AdminScreen, label: 'Quản lý Giao dịch', icon: 'credit-card' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setIsDrawerOpen(!isDrawerOpen)}>
          <Icon name="bars" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Panel</Text>
      </View>

      <View style={styles.contentContainer}>
        {/* Drawer */}
        {isDrawerOpen && (
          <View style={styles.drawer}>
            <View style={styles.drawerContent}>
              <ScrollView style={styles.menuContainer}>
                {menuItems.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.menuItem,
                      currentScreen === item.name && styles.activeMenuItem
                    ]}
                    onPress={() => {
                      setCurrentScreen(item.name);
                      setIsDrawerOpen(false);
                    }}
                  >
                    <Icon 
                      name={item.icon} 
                      size={20} 
                      color={currentScreen === item.name ? 'white' : '#666'} 
                    />
                    <Text style={[
                      styles.menuText,
                      currentScreen === item.name && styles.activeMenuText
                    ]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              <TouchableOpacity 
                style={styles.homeButton}
                onPress={() => {/* Navigate to home */}}
              >
                <Icon name="home" size={20} color="#666" />
                <Text style={styles.homeButtonText}>Trở về trang chủ</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Main Content */}
        <View style={styles.mainContent}>
          {renderScreen()}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  headerTitle: {
    marginLeft: 15,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007bff',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawerContent: {
    width: 250,
    height: '100%',
    backgroundColor: '#f8f9fa',
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 5,
  },
  activeMenuItem: {
    backgroundColor: '#007bff',
  },
  menuText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeMenuText: {
    color: 'white',
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
  },
  homeButtonText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#666',
  },
  mainContent: {
    flex: 1,
    padding: 20,
  },
  screenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AdminLayout;