import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ImageBackground, 
  StyleSheet, 
  Dimensions, 
  ScrollView 
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface AuthLayoutProps {
  children: React.ReactNode;
  onSwitchMode?: () => void;
  isLogin?: boolean;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ 
  children, 
  onSwitchMode, 
  isLogin = true 
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.leftSection}>
          <ImageBackground
            source={{ uri: 'https://images.pexels.com/photos/4881619/pexels-photo-4881619.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2' }}
            style={styles.backgroundImage}
            imageStyle={styles.imageStyle}
          >
            <View style={styles.overlay}>
              <View style={styles.content}>
                <Text style={styles.title}>Chào mừng đến với GrandProject.</Text>
                <Text style={styles.description}>
                  Kết nối, chia sẻ và khám phá cộng đồng game thủ lớn mạnh. Hãy tham gia cùng chúng tôi ngay hôm nay!
                </Text>
                {onSwitchMode && (
                  <TouchableOpacity style={styles.button} onPress={onSwitchMode}>
                    <Text style={styles.buttonText}>
                      {isLogin ? 'Tạo tài khoản mới' : 'Đã có tài khoản? Đăng nhập'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </ImageBackground>
        </View>
        
        <ScrollView 
          style={styles.rightSection}
          contentContainerStyle={styles.rightContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.formTitle}>{isLogin ? 'Đăng nhập' : 'Đăng ký'}</Text>
          {children}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 900,
    height: height * 0.8,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: width > 768 ? 'row' : 'column',
  },
  leftSection: {
    flex: 1,
    display: width > 768 ? 'flex' : 'none',
  },
  backgroundImage: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 123, 255, 0.8)',
  },
  imageStyle: {
    opacity: 0.8,
  },
  content: {
    flex: 1,
    padding: 50,
    justifyContent: 'center',
    gap: 30,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: 'white',
    lineHeight: 42,
  },
  description: {
    fontSize: 16,
    color: 'white',
  },
  button: {
    padding: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    backgroundColor: 'transparent',
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  rightSection: {
    flex: 1,
  },
  rightContent: {
    padding: 40,
    justifyContent: 'center',
    gap: 30,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
});

export default AuthLayout;