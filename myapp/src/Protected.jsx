import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export default function Protected({ children }) {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.log("🔍 Protected route auth check error:", error.message);
          setUser(null);
          return;
        }
        setUser(data.user);
      } catch (err) {
        console.log("🔍 Protected route auth exception:", err.message);
        setUser(null);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (user === null) {
      alert("You are not logged in. Please login to continue.");
    }
  }, [user]);

  if (user === undefined) return <p>Loading...</p>;

  return user ? children : <Navigate to="/login" />;
}