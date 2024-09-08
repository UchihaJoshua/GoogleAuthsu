import { StatusBar } from 'expo-status-bar';
import * as React from "react";
import { StyleSheet, Text, View, Button, Image } from 'react-native';
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

export default function App() {
  const [userInfo, setUserInfo] = React.useState(null);
  const [loading, setLoading] = React.useState(true); // State to track loading

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: "545004980786-v088am8d8b97q2jillcf18c0cfjr69h5.apps.googleusercontent.com",
    androidClientId: "545004980786-5ptep15ld3vv3ibns21vuhvutrd38r85.apps.googleusercontent.com",
  });

  // Load user info from AsyncStorage when the app starts
  React.useEffect(() => {
    const fetchLocalUser = async () => {
      const storedUser = await getLocalUser();
      console.log("Stored user: ", storedUser);
      if (storedUser) {
        setUserInfo(storedUser);
      }
      setLoading(false); // Finished loading stored user data
    };
    fetchLocalUser();
  }, []);

  // Handle Google login response
  React.useEffect(() => {
    const handleGoogleLogin = async () => {
      if (response?.type === 'success' && response.authentication) {
        console.log("Google login successful, token: ", response.authentication.accessToken);
        const user = await getUserinfo(response.authentication.accessToken);
        console.log("Fetched user info: ", user);
        if (user) {
          await AsyncStorage.setItem("@user", JSON.stringify(user)); // Store user data locally
          setUserInfo(user); // Set the user info in state
        }
      } else {
        console.log("Google login failed or cancelled, response: ", response);
      }
    };
    handleGoogleLogin();
  }, [response]);

  // Function to get user info from AsyncStorage
  const getLocalUser = async () => {
    try {
      const data = await AsyncStorage.getItem("@user");
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      console.error("Error loading user from storage", error);
      return null;
    }
  };

  // Function to fetch user info from Google API
  const getUserinfo = async (token) => {
    if (!token) return null;

    try {
      const response = await fetch(
        "https://www.googleapis.com/userinfo/v2/me",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user info from Google");
      }

      const user = await response.json();
      return user;

    } catch (error) {
      console.error("Error fetching user info", error);
      return null;
    }
  };

  // Render the UI
  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!userInfo ? (
        <Button
          title="Login with Google"
          onPress={() => {
            promptAsync();
          }}
        />
      ) : (
        <View>
          <Image style={styles.image} source={{ uri: userInfo.picture }} />
          <Text style={styles.text}>Email: {userInfo.email}</Text>
          <Text style={styles.text}>Full Name: {userInfo.name}</Text>

          <Button
            title="Log out"
            onPress={async () => {
              await AsyncStorage.removeItem("@user"); // Remove user info from storage
              setUserInfo(null); // Clear the user info from state
              console.log("User logged out, AsyncStorage cleared");
            }}
          />
        </View>
      )}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 20,
    fontWeight: "bold",
  },
  image: {
    width: 100,
    height: 100,
  },
});
