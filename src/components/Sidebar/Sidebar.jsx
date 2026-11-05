// components/Sidebar/Sidebar.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Sidebar.css";
import { supabase } from "../../client";

function Sidebar() {
  
    const navigate = useNavigate();

    const handleLogout = async () => {

        const { error } = await supabase.auth.signOut();
        
        if(error)
        {
            console.error("Logout failed: ", error.message);
        }
        else
        {
            console.log("Logged out successfully");
            navigate("/login");
        }
    }

    return (
    <>
      <div>
        <aside className="sidebar">
          <nav className="sidebar-nav">
            <ul className="nav-list">
              <li className="nav-item">
                <Link to="/home" className="nav-link">
                  <span className="material-symbols-rounded">home</span>
                  <span className="nav-label">Home</span>
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/create" className="nav-link">
                  <span className="material-symbols-rounded">post_add</span>
                  <span className="nav-label">Create</span>
                </Link>
              </li>
                <li className="nav-item">
                <Link to="/profile" className="nav-link">
                  <span className="material-symbols-outlined">account_circle</span>
                  <span className="nav-label">Profile</span>
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/edit" className="nav-link">
                  <span className="material-symbols-rounded">edit</span>
                  <span className="nav-label">Edit post</span>
                </Link>
              </li>
              <li className="nav-item">
                <button className="nav-link logout-button" onClick={handleLogout}>
                  <span className="material-symbols-rounded">Logout</span>
                  <span className="nav-label">Log Out</span>
                </button>
              </li>
            </ul>
          </nav>
        </aside>
      </div>
    </>
  );
}

export default Sidebar;
