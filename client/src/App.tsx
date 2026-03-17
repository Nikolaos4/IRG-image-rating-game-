import { Navigate, Route, Routes } from "react-router-dom";
import "./assets/scss/app.scss";
import IndexPage from "./pages/IndexPage/IndexPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Header from "./components/Header/Header";

function App() {
    return (
        <>
            <Header />
            <Routes>
                <Route
                    path="/"
                    element={<IndexPage />}
                />
                <Route
                    path="/login"
                    element={<LoginPage />}
                />
                <Route
                    path="/register"
                    element={<RegisterPage />}
                />
                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/"
                            replace
                        />
                    }
                />
            </Routes>
        </>
    );
}

export default App;
