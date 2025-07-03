import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import LoginScreen from "./screens/LoginScreen";
// import ChatListScreen from "./screens/ChatListScreen";
import "./App.css";
import ChatDetailScreen from "./screens/ChatDetailScreen";
import ChatListScreen from "./screens/ChatListScreen";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/chats" element={<ChatListScreen />} />
        <Route path="/chats/:chatId" element={<ChatDetailScreen />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
