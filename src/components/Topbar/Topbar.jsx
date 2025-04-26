import "./Topbar.css";

function Topbar({ onSearchChange, onSortChange }) 
{
    return (
        <>
            <div className="topbar">
                <nav className="nav">
                    <h2>Flop or Hit</h2>
                    <div className="search-box">
                        <span className="material-symbols-rounded search-icon">search</span>
                        <input type="text" placeholder="Search post titles here..." onChange={(e) => onSearchChange(e.target.value)} />
                    </div>
                    <ul className="links-nav">
                        <li>
                            <label>Sort by:</label>
                            <select className="sorting" onChange={(e) => onSortChange(e.target.value)}>
                                <option value="latest">Latest</option>
                                <option value="oldest">Oldest</option>
                                <option value="most upvoted">Most Upvoted</option>
                            </select>
                        </li>
                    </ul>
                </nav>
            </div>
        </>
    )
}

export default Topbar;