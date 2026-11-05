# 🎬 Flop or Hit

**A full-stack social media application where movie enthusiasts can discuss upcoming releases, share opinions, and vote on whether a movie will be a flop or a hit.**

Built with React, JavaScript, Supabase Authentication, and PostgreSQL.

## 🎥 Video Walkthrough

![Flop or Hit Application Walkthrough](Final%20Project%20Walk%20through.gif)

*A walkthrough demonstrating the original application, including post creation, navigation, and social interactions.*

## 📖 Overview

Flop or Hit is a movie-focused social media application that allows authenticated users to create posts, discuss upcoming movies, leave comments, and upvote content.

The application combines an interactive React frontend with Supabase backend services for user authentication and persistent PostgreSQL data storage.

Originally developed as an independent final project for CodePath's Web Development program in 2025, Flop or Hit is being revisited and expanded with improvements to its backend, security, and user experience.

## ✨ Features

### 🔐 User Authentication
- User registration and login through Supabase Authentication
- Persistent authentication sessions
- Logout functionality
- Protected application routes
- User-associated post ownership

### 📝 Post Management
- Create posts with a required title
- Add optional text content and image URLs
- Browse posts in a home feed
- View individual posts with their full content
- Edit and delete posts created by the authenticated user
- Persist posts in PostgreSQL

### 💬 Social Interactions
- Add comments to posts
- Persist comments in the database
- Upvote posts with database-backed like counts
- View post engagement and discussions

### 🔎 Search and Sorting
- Search posts by title
- Sort posts by newest or oldest
- Sort posts by upvote count

### 🛡️ Database Security
- PostgreSQL relational tables with primary and foreign key constraints
- Row Level Security (RLS) enabled for posts and comments
- Ownership-based policies restricting post creation, editing, and deletion
- Authentication-based access policies for reading and creating comments

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React | Interactive frontend |
| JavaScript | Application logic |
| CSS | Styling and layout |
| React Router | Navigation and protected routes |
| Supabase Auth | User authentication and session management |
| Supabase | Backend database access |
| PostgreSQL | Persistent relational data |
| Git & GitHub | Version control |

## 🏗️ Architecture

Flop or Hit uses a React frontend connected directly to Supabase backend services.

**Frontend — React**

Handles navigation, forms, post feeds, search, sorting, and user interactions.

**Authentication — Supabase Auth**

Manages user registration, login, logout, and authentication sessions.

**Database — PostgreSQL**

Stores posts, comments, user associations, timestamps, and upvote counts.

**Authorization — PostgreSQL Row Level Security**

Enforces database-level permissions for accessing and modifying content.

The application uses Supabase's client library to communicate with backend services without requiring a separately hosted Express server.

## 🗄️ Database Design

### Posts

The `flop-or-hit` table stores:
- Post ID
- Author's user ID
- Title
- Optional content
- Optional image URL
- Upvote count
- Creation timestamp

### Comments

The `comments` table stores:
- Comment ID
- Associated post ID
- Author's user ID
- Comment content
- Creation timestamp

Comments reference their associated posts through a foreign key relationship. Deleting a post also deletes its associated comments.

### Access Control

Row Level Security policies restrict post modifications to the authenticated post owner.

Comment creation is restricted to authenticated users creating comments under their own user identity.

These policies provide database-level authorization in addition to the application's frontend route protection.

## 🚧 Current Development Status

The original version was completed in 2025 and included authentication, post CRUD operations, comments, upvotes, search, sorting, and database integration.

The original Supabase project was subsequently paused after an extended period of inactivity. Its database backup has been recovered, and restoration and further development are planned.

The original walkthrough above demonstrates the previously working application. A new live deployment is not yet available.

## 🗺️ Planned Improvements

- [x] Restore/create new PostgreSQL database and authentication configuration
- [x] Verify Row Level Security policies using multiple test accounts
- [x] Implement comment editing and deletion
- [x] Replace the simple upvote counter with user-specific likes and unlikes
- [x] Prevent duplicate likes by the same user
- [x] Add direct image uploads with object storage
- [ ] Improve loading states, error handling, and form validation
- [ ] Improve responsive design and mobile usability
- [ ] Add automated tests for important user interactions
- [ ] Deploy the application publicly
- [x] Create user profile
- [x] Edit user profile
- [ ] View Feed without an account

## 🧠 Engineering Challenges and Lessons

**Authentication and authorization**

One of the most challenging parts of the original implementation was configuring Supabase Row Level Security policies while ensuring authenticated users could perform the intended database operations.

This project provided hands-on experience connecting user authentication to persistent database records and enforcing ownership rules.

**Relational data modeling**

Posts and comments are stored in related PostgreSQL tables, allowing comments to be associated with individual posts and authors.

**Frontend and backend integration**

The application uses asynchronous database requests to retrieve, create, update, and delete data while keeping the React interface synchronized with successful operations.

## 📚 Project Background

Flop or Hit began as my independent final project for CodePath's Web Development program in 2025.

I designed and implemented the original application from scratch over approximately 2.5 days, including its React frontend, Supabase integration, authentication, and database functionality.

I am now revisiting the project to strengthen its security, expand its features, and improve its overall engineering quality.

## 📄 License

License information will be finalized before public release.
