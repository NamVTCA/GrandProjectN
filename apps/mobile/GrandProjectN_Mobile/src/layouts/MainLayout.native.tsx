import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

// Placeholder components - replace with your actual screens
function HomeScreen() {
  return (
    <View style={styles.screenContainer}>
      <Text>Trang chủ</Text>
    </View>
  );
}

function ExploreScreen() {
  return (
    <View style={styles.screenContainer}>
      <Text>Khám phá</Text>
    </View>
  );
}

function NotificationsScreen() {
  return (
    <View style={styles.screenContainer}>
      <Text>Thông báo</Text>
    </View>
  );
}

function ProfileScreen() {
  return (
    <View style={styles.screenContainer}>
      <Text>Hồ sơ</Text>
    </View>
  );
}

// Header Component
function Header() {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>GrandProject</Text>
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.headerButton}>
          <Icon name="search" size={20} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton}>
          <Icon name="bell" size={20} color="#333" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Sidebar Component (for tablet)
function Sidebar() {
  const [activeTab, setActiveTab] = useState('Home');
  
  const menuItems = [
    { name: 'Home', label: 'Trang chủ', icon: 'home' },
    { name: 'Explore', label: 'Khám phá', icon: 'compass' },
    { name: 'Notifications', label: 'Thông báo', icon: 'bell' },
    { name: 'Profile', label: 'Hồ sơ', icon: 'user' },
  ];

  return (
    <View style={styles.sidebar}>
      <View style={styles.sidebarHeader}>
        <Text style={styles.sidebarTitle}>GrandProject</Text>
      </View>
      
      <View style={styles.sidebarMenu}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.sidebarItem,
              activeTab === item.name && styles.activeSidebarItem
            ]}
            onPress={() => setActiveTab(item.name)}
          >
            <Icon name={item.icon} size={20} color={activeTab === item.name ? '#007bff' : '#333'} />
            <Text style={[
              styles.sidebarItemText,
              activeTab === item.name && styles.activeSidebarItemText
            ]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// Rightbar Component (for tablet)
function Rightbar() {
  return (
    <View style={styles.rightbar}>
      <Text style={styles.rightbarTitle}>Bạn bè trực tuyến</Text>
      {/* Danh sách bạn bè sẽ được thêm ở đây */}
    </View>
  );
}

const MainLayout: React.FC = () => {
  const { width } = Dimensions.get('window');
  const isTablet = width >= 768;
  const [activeTab, setActiveTab] = useState('Home');

  const renderScreen = () => {
    switch (activeTab) {
      case 'Home': return <HomeScreen />;
      case 'Explore': return <ExploreScreen />;
      case 'Notifications': return <NotificationsScreen />;
      case 'Profile': return <ProfileScreen />;
      default: return <HomeScreen />;
    }
  };

  if (isTablet) {
    return (
      <View style={styles.tabletContainer}>
        <Sidebar />
        <View style={styles.tabletContent}>
          <Header />
          <View style={styles.mainContent}>
            {renderScreen()}
          </View>
        </View>
        <Rightbar />
      </View>
    );
  }

  // For mobile devices
  const menuItems = [
    { name: 'Home', label: 'Trang chủ', icon: 'home' },
    { name: 'Explore', label: 'Khám phá', icon: 'compass' },
    { name: 'Notifications', label: 'Thông báo', icon: 'bell' },
    { name: 'Profile', label: 'Hồ sơ', icon: 'user' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Header />
        <View style={styles.mainContent}>
          {renderScreen()}
        </View>
      </View>
      
      {/* Bottom Tab Navigation */}
      <View style={styles.bottomTab}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.tabItem,
              activeTab === item.name && styles.activeTabItem
            ]}
            onPress={() => setActiveTab(item.name)}
          >
            <Icon 
              name={item.icon} 
              size={20} 
              color={activeTab === item.name ? '#007bff' : 'gray'} 
            />
            <Text style={[
              styles.tabText,
              activeTab === item.name && styles.activeTabText
            ]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  tabletContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  content: {
    flex: 1,
    marginBottom: 60, // Space for bottom tab
  },
  tabletContent: {
    flex: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#dee2e6',
  },
  mainContent: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007bff',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 15,
    padding: 8,
  },
  sidebar: {
    width: 250,
    backgroundColor: 'white',
    borderRightWidth: 1,
    borderRightColor: '#dee2e6',
  },
  sidebarHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007bff',
  },
  sidebarMenu: {
    padding: 10,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 5,
  },
  activeSidebarItem: {
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
  },
  sidebarItemText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  activeSidebarItemText: {
    color: '#007bff',
    fontWeight: 'bold',
  },
  rightbar: {
    width: 250,
    backgroundColor: 'white',
    borderLeftWidth: 1,
    borderLeftColor: '#dee2e6',
    padding: 15,
  },
  rightbarTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  screenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomTab: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
  },
  activeTabItem: {
    // Highlight active tab
  },
  tabText: {
    fontSize: 12,
    color: 'gray',
    marginTop: 4,
  },
  activeTabText: {
    color: '#007bff',
    fontWeight: 'bold',
  },
});

export default MainLayout;