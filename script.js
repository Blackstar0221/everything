const SUPABASE_URL = "https://syfdswxebgbennfeeqis.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Xd6eltADYlYgU58ZnVIR7Q_khTU-y34";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const formTitle = document.getElementById("formTitle");
const subtitle = document.getElementById("subtitle");
const signupFields = document.getElementById("signupFields");
const submitBtn = document.getElementById("submitBtn");
const toggleModeBtn = document.getElementById("toggleMode");
const switchPrompt = document.getElementById("switchPrompt");
const switchText = document.getElementById("switchText");
const authForm = document.getElementById("authForm");
const message = document.getElementById("message");

const userModeBtn = document.getElementById("userModeBtn");
const adminModeBtn = document.getElementById("adminModeBtn");

const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

let isLoginMode = true;
let isAdminMode = false;

function updateUI() {
  if (isAdminMode) {
    isLoginMode = true;
  }

  const roleText = isAdminMode ? "Admin" : "User";
  const actionText = isLoginMode ? "Log In" : "Create Account";

  formTitle.textContent = `${roleText} ${actionText}`;
  submitBtn.textContent = actionText;

  if (isAdminMode) {
    subtitle.textContent = "Admin access portal 🔐";
    signupFields.classList.add("hidden");
    switchText.classList.add("hidden");
  } else {
    switchText.classList.remove("hidden");

    if (isLoginMode) {
      subtitle.textContent = "Welcome back 👋";
      switchPrompt.textContent = "Don't have an account?";
      toggleModeBtn.textContent = "Create Account";
      signupFields.classList.add("hidden");
    } else {
      subtitle.textContent = "Make your new account ✨";
      switchPrompt.textContent = "Already have an account?";
      toggleModeBtn.textContent = "Log In";
      signupFields.classList.remove("hidden");
    }
  }

  userModeBtn.classList.toggle("active", !isAdminMode);
  adminModeBtn.classList.toggle("active", isAdminMode);

  message.textContent = "";
}

toggleModeBtn.addEventListener("click", () => {
  if (!isAdminMode) {
    isLoginMode = !isLoginMode;
    updateUI();
  }
});

userModeBtn.addEventListener("click", () => {
  isAdminMode = false;
  updateUI();
});

adminModeBtn.addEventListener("click", () => {
  isAdminMode = true;
  isLoginMode = true;
  updateUI();
});

authForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const username = usernameInput.value.trim();

  message.textContent = "Loading...";

  if (!email || !password) {
    message.textContent = "Please enter your email and password.";
    return;
  }

  if (!isLoginMode && !isAdminMode && !username) {
    message.textContent = "Please enter a username.";
    return;
  }

  if (isAdminMode) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      message.textContent = error.message;
      return;
    }

    const user = data.user;

    if (!user) {
      message.textContent = "Admin login failed.";
      return;
    }

    const role = user.user_metadata?.role;

    if (role !== "admin") {
      await supabaseClient.auth.signOut();
      message.textContent = "This account is not an admin account.";
      return;
    }

    message.textContent = "Admin login successful!";
    window.location.href = "home.html";
    return;
  }

  if (isLoginMode) {
    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      message.textContent = error.message;
      return;
    }

    message.textContent = "User login successful!";
    window.location.href = "home.html";
  } else {
    const { error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
          role: "user"
        }
      }
    });

    if (error) {
      message.textContent = error.message;
      return;
    }

    message.textContent = "Account created! You can log in now.";
    authForm.reset();
    isLoginMode = true;
    updateUI();
  }
});

updateUI();
