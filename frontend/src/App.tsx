import { BrowserRouter as Router } from "react-router-dom";
import { Provider } from "react-redux";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { store } from "./store";
import Layout from "./components/Layout";
import { Routes } from "./routes";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
});

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Layout>
            <Routes />
          </Layout>
        </Router>
        <ToastContainer />
      </ThemeProvider>
    </Provider>
  );
}

export default App;
