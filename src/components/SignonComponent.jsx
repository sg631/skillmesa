import React from "react";
import { Paper, Tabs, TextInput, PasswordInput, Button, Title, Stack } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import "@mantine/dates/styles.css";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../firebase.js";
import { doc, setDoc } from "firebase/firestore";
import showAlert from "../components/ShowAlert.jsx";

function SignonComponent({ mode = "dual", width, height }) {
  const [activeTab, setActiveTab] = React.useState("signup");
  const [signUpData, setSignUpData] = React.useState({
    realName: "",
    username: "",
    email: "",
    password: "",
    displayName: "",
    dob: null,
  });
  const [loginData, setLoginData] = React.useState({
    email: "",
    password: "",
  });

  async function handleSignUp() {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        signUpData.email,
        signUpData.password
      );
      const user = userCredential.user;

      const rand = () => Math.floor(Math.random() * 256);
      const rectColor = `rgb(${rand()}, ${rand()}, ${rand()})`;
      const circleColor = `rgb(${rand()}, ${rand()}, ${rand()})`;

      const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
          <rect x="50" y="50" width="100" height="100" fill="${rectColor}" />
          <circle cx="250" cy="150" r="70" fill="${circleColor}" />
      </svg>
      `.trim();

      const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

      await setDoc(doc(db, "users", user.uid), {
        fullname: signUpData.realName,
        username: signUpData.username,
        email: signUpData.email,
        createdAt: new Date(),
        profilePic: {
          setProfilePic: false,
          svgDataUrl: svgDataUrl,
          currentUrl: svgDataUrl,
        },
        dob: signUpData.dob || null,
        displayName: signUpData.displayName || signUpData.username,
        contact: {
          email: signUpData.email,
          phone: null,
        },
      });

      await updateProfile(user, {
        displayName: signUpData.displayName || signUpData.username,
        photoURL: svgDataUrl,
      });

      window.location.href = "/onboarding";
    } catch (error) {
      let errorMessage = "Unexpected Error " + error.code + ": " + error.message;
      switch (error.code) {
        case "auth/invalid-email":
          errorMessage = "Invalid email.";
          break;
        case "auth/email-already-in-use":
          errorMessage = "An account with that email already exists.";
          break;
        case "auth/operation-not-allowed":
          errorMessage = "You may not use that sign-up method.";
          break;
        case "auth/weak-password":
          errorMessage = "Weak password. Password must have an uppercase, lowercase, symbol, and be at least 6 characters long.";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many recent requests. Try again later.";
          break;
        case "auth/password-does-not-meet-requirements":
          errorMessage = "Password does not meet requirements. It must have an uppercase, lowercase, symbol, number, and be at least 6 characters long.";
          break;
      }
      showAlert(errorMessage);
    }
  }

  function handleLogin() {
    signInWithEmailAndPassword(auth, loginData.email, loginData.password)
      .then(() => {
        window.location.href = "/home";
      })
      .catch((error) => {
        let errorMessage = "Unexpected Error " + error.code + ": " + error.message;
        switch (error.code) {
          case "auth/user-not-found":
            errorMessage = "Sorry, no account found with email address.";
            break;
          case "auth/wrong-password":
            errorMessage = "Incorrect password.";
            break;
          case "auth/invalid-email":
            errorMessage = "Invalid email.";
            break;
          case "auth/too-many-requests":
            errorMessage = "Too many failed attempts. Please try again later.";
            break;
          case "auth/invalid-credential":
            errorMessage = "The credential is invalid. Double check the password and email.";
            break;
          case "auth/user-disabled":
            errorMessage = "That user has been disabled by the admin.";
            break;
          case "auth/operation-not-allowed":
            errorMessage = "You may not use this method of sign-on.";
            break;
          case "auth/invalid-login-credentials":
            errorMessage = "Email or password is wrong. Double-check and try again.";
            break;
        }
        showAlert(errorMessage);
      });
  }

  return (
    <Paper
      shadow="md"
      p="xl"
      radius="lg"
      style={{
        width: width || "360px",
        maxWidth: "95vw",
      }}
    >
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List grow mb="lg">
          <Tabs.Tab value="signup">Sign Up</Tabs.Tab>
          <Tabs.Tab value="login">Log In</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="signup">
          <form onSubmit={(e) => { e.preventDefault(); handleSignUp(); }}>
            <Stack gap="sm">
              <Title order={2} ta="center">Sign Up</Title>
              <TextInput
                placeholder="Full Name *"
                required
                value={signUpData.realName}
                onChange={(e) => setSignUpData({ ...signUpData, realName: e.target.value })}
              />
              <TextInput
                placeholder="Display Name"
                value={signUpData.displayName}
                onChange={(e) => setSignUpData({ ...signUpData, displayName: e.target.value })}
              />
              <TextInput
                placeholder="Username *"
                required
                value={signUpData.username}
                onChange={(e) => setSignUpData({ ...signUpData, username: e.target.value })}
              />
              <DatePickerInput
                label="Birthday"
                placeholder="Pick a date"
                value={signUpData.dob}
                onChange={(val) => setSignUpData({ ...signUpData, dob: val })}
                maxDate={new Date()}
                clearable
              />
              <TextInput
                type="email"
                placeholder="Email *"
                required
                value={signUpData.email}
                onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
              />
              <PasswordInput
                placeholder="Password *"
                required
                autoComplete="skillmesa"
                value={signUpData.password}
                onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
              />
              <Button type="submit" fullWidth>
                Sign Up
              </Button>
            </Stack>
          </form>
        </Tabs.Panel>

        <Tabs.Panel value="login">
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
            <Stack gap="sm">
              <Title order={2} ta="center">Log In</Title>
              <TextInput
                type="email"
                placeholder="Email *"
                required
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
              />
              <PasswordInput
                placeholder="Password *"
                required
                autoComplete="skillmesa"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              />
              <Button type="submit" fullWidth>
                Log In
              </Button>
            </Stack>
          </form>
        </Tabs.Panel>
      </Tabs>
    </Paper>
  );
}

export default SignonComponent;
