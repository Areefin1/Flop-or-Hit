# 🎬 Flop or Hit

**A full-stack social media application where movie enthusiasts can discuss upcoming releases, share opinions, and vote on whether a movie will be a flop or a hit.**

Built with React, JavaScript, Supabase Authentication, Supabase Storage, and PostgreSQL.

## 🎥 Video Walkthrough

![Flop or Hit Application Walkthrough](Final%20Project%20Walk%20through.gif)

*Original 2025 application walkthrough demonstrating post creation, navigation, and social interactions. An updated walkthrough featuring the latest functionality is planned.*

## 📖 Overview

Flop or Hit is a movie-focused social media application that allows users to create posts, discuss movies, interact through comments and reactions, and manage their own profiles.

The application combines a React frontend with Supabase backend services for authentication, PostgreSQL data storage, and image uploads.

Originally developed as an independent final project for CodePath's Web Development program in 2025, Flop or Hit has since been rebuilt and expanded with improved database security, user-specific interactions, profile management, and image storage.

The project is actively being developed, with upcoming improvements focused on UI/UX, performance optimization, automated testing, and public deployment.

## ✨ Features

### 🔐 User Authentication
- User registration and login through Supabase Authentication
- Persistent authentication sessions
- Logout functionality
- Protected application routes
- User-specific ownership of posts, comments, and profiles

### 👤 User Profiles
- Automatically associated user profiles
- Unique usernames and editable display names
- Optional user biographies
- Upload, replace, and remove profile pictures
- View posts created by the authenticated user
- Profile editing with persistent database updates

### 📝 Post Management
- Create posts with a required title
- Add optional text content and uploaded images
- Browse posts in a home feed
- View individual posts with their full content
- Edit post titles, descriptions, and images
- Delete posts created by the authenticated user
- Upload, replace, or remove existing post images
- Persist post information in PostgreSQL

### 💬 Comments and Reactions
- Create, edit, and delete comments
- Store comments persistently in PostgreSQL
- Like and unlike posts
- Dislike posts
- Track user-specific reactions
- Prevent duplicate reactions from the same user
- Display reaction counts on posts
- View post discussions and engagement

### 🖼️ Image Uploads and Storage
- Direct image uploads using Supabase Storage
- Separate Storage buckets for post images and profile avatars
- Support for JPEG, PNG, and WebP images
- Replace existing images without leaving outdated database references
- Remove images without requiring replacements
- Automatically delete old images after successful database updates
- Clean up newly uploaded images when database updates fail
- Storage access policies restricting uploads and deletions to authorized users

### 🔎 Search and Sorting
- Search posts by title
- Sort posts by newest or oldest
- Sort posts by popularity using reaction counts

### 🛡️ Database Security
- PostgreSQL relational tables with primary and foreign key constraints
- Row Level Security (RLS) policies
- Ownership-based authorization for modifying user-created content
- User-specific reaction records
- Authentication-based restrictions on protected operations
- Supabase Storage policies restricting file operations to authorized users

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React | Interactive frontend and component-based UI |
| JavaScript | Application logic |
| CSS | Styling and layout |
| React Router | Navigation and protected routes |
| Supabase Authentication | User authentication and session management |
| Supabase Storage | Post image and avatar uploads |
| Supabase JavaScript Client | Communication with backend services |
| PostgreSQL | Persistent relational database |
| PostgreSQL Row Level Security | Database-level authorization |
| Git & GitHub | Version control and development workflow |

## 🏗️ Architecture

Flop or Hit uses a React frontend connected directly to Supabase backend services.

**Frontend — React**

Handles navigation, forms, post feeds, profile pages, search, sorting, and user interactions.

React state is updated after successful database operations to keep the interface synchronized with stored data.

**Service Layer — JavaScript**

Centralizes application operations involving posts, profiles, comments, reactions, and images.

Service functions coordinate database updates and file storage operations, keeping backend-related logic separate from React components.

**Authentication — Supabase Auth**

Manages user registration, login, logout, and persistent authentication sessions.

Authenticated user IDs are used to associate content with its owner.

**Database — PostgreSQL**

Stores posts, comments, profiles, reactions, and their relationships.

Foreign key constraints maintain relationships between users and their content.

**File Storage — Supabase Storage**

Stores uploaded post images and profile avatars in separate buckets.

Image paths are saved in PostgreSQL, while the actual image files are stored in Supabase Storage.

**Authorization — Row Level Security**

Enforces database-level permissions for reading and modifying protected records.

Storage policies restrict user-specific file operations.

The application communicates with Supabase through its JavaScript client without requiring a separately hosted Express server.

## 🗄️ Database Design

### Posts — `posts`

Stores:
- Post ID
- Author's user ID
- Title
- Optional text content
- Optional image path
- Creation timestamp

Each post is associated with its author through a user ID.

### Comments — `comments`

Stores:
- Comment ID
- Associated post ID
- Author's user ID
- Comment content
- Creation timestamp

Comments are associated with posts and users through relational references.

Users can create, edit, and delete comments according to the application's authorization rules.

### Profiles — `profiles`

Stores:
- User ID
- Unique username
- Display name
- Optional biography
- Optional avatar path
- Profile creation timestamp

Each profile is associated with an authenticated user.

The avatar path references an image stored in Supabase Storage rather than storing the image itself in PostgreSQL.

### Post Reactions — `post_reactions`

Stores user-specific reactions to posts.

Reaction records associate:
- A user
- A post
- A reaction type, such as like or dislike

This design allows the application to track individual reactions, calculate engagement counts, and prevent duplicate reactions.

Unlike a simple counter stored directly on each post, user-specific reaction records allow the application to identify which users have reacted.

### Supabase Storage

Two separate Storage buckets are used:

**`post-images`**
- Stores images attached to posts
- Supports uploading, replacing, and deleting images

**`avatars`**
- Stores user profile pictures
- Supports uploading, replacing, and removing avatars

Uploaded files are organized under user-specific paths.

Storage policies restrict file modifications based on the authenticated user's identity.

### Access Control

Post modification is restricted to the authenticated post owner through Row Level Security.

Profile updates are associated with the authenticated user's identity.

User-specific reaction and comment operations are governed by database authorization policies.

These protections operate at the database level rather than relying exclusively on frontend route restrictions.

## 🚧 Current Development Status

Flop or Hit is an actively developed project.

The original application was completed in 2025 as a CodePath Web Development final project.

Following the inactivity of the original Supabase project, the backend was recreated with updated database tables, authentication configuration, and Row Level Security policies.

The application has since been expanded with:

- User profile creation and editing
- Profile avatar uploads, replacements, and removal
- Post image uploads, replacements, and removal
- Full post and comment management
- User-specific likes and dislikes
- Improved relational database structure
- Supabase Storage integration
- Image cleanup and database error handling

The latest changes have been integrated into the `develop` branch.

**The application is not yet publicly deployed.** The walkthrough above demonstrates the original 2025 version rather than the latest development build.

## 🗺️ Development Roadmap

### Completed

- [x] Recreate PostgreSQL database and authentication configuration
- [x] Verify Row Level Security policies using multiple test accounts
- [x] Implement post creation, editing, and deletion
- [x] Implement comment creation, editing, and deletion
- [x] Replace the original upvote counter with user-specific reactions
- [x] Prevent duplicate reactions by the same user
- [x] Add direct image uploads using Supabase Storage
- [x] Support post image replacement and removal
- [x] Create user profiles
- [x] Implement profile editing
- [x] Support avatar uploads, replacements, and removal
- [x] Implement image cleanup after successful replacements and deletions
- [x] Handle cleanup of newly uploaded images after failed database updates

### Planned

- [ ] Redesign the application UI with consistent styling across pages
- [ ] Improve responsive design and mobile usability
- [ ] Improve loading states, error handling, and form validation
- [ ] Measure frontend and database operation performance
- [ ] Identify and optimize slow API calls, database queries, and UI updates
- [ ] Compare performance before and after optimizations
- [ ] Add automated tests for important user interactions
- [ ] Allow visitors to browse the feed without an account
- [ ] Record an updated application walkthrough
- [ ] Deploy the application publicly

## 🧠 Engineering Challenges and Lessons

### Authentication and Authorization

One of the major challenges was configuring Supabase Row Level Security while ensuring authenticated users could perform the intended operations.

This required connecting user identities to database records and enforcing ownership rules for posts, profiles, comments, and reactions.

The project provided hands-on experience with the difference between frontend route protection and database-level authorization.

### Relational Data Modeling

The application uses related PostgreSQL tables for posts, comments, profiles, and reactions.

Rather than storing only a numerical upvote count on each post, the updated design stores individual user reactions.

This makes it possible to track user-specific interactions and prevent duplicate reactions.

### File Storage and Database Coordination

Adding direct image uploads introduced the challenge of coordinating PostgreSQL records with files stored separately in Supabase Storage.

When a user replaces an image, the application must upload the new file, update the database reference, and remove the previous file.

Deleting an image requires clearing its database reference and removing the corresponding Storage object.

To reduce the risk of broken references, the application updates the database before deleting the old image.

If a database update fails after a new image has been uploaded, the application attempts to remove the unused upload.

This improved the reliability of post and profile image management.

### Separating UI and Business Logic

The application originally handled some image upload and deletion operations directly inside React components.

These operations were moved into service functions responsible for coordinating database and Storage changes.

React components now focus on collecting user input, calling service functions, and updating the interface after successful operations.

This makes the code easier to maintain and reduces duplicated logic.

### Frontend and Backend Integration

The application uses asynchronous Supabase operations to retrieve, create, update, and delete data.

React state is updated after successful operations to keep the interface consistent with the database.

Managing loading states, errors, and user interactions has provided practical experience building a frontend that communicates with persistent backend services.

### Performance Optimization — Planned

Some application interactions currently exhibit noticeable loading or refresh delays.

Future work will involve measuring individual database requests, network operations, and frontend rendering performance to identify bottlenecks.

Optimizations will be evaluated using before-and-after measurements rather than estimated improvements.

## 📚 Project Background

Flop or Hit began as my independent final project for CodePath's Web Development program in 2025.

I designed and implemented the original application from scratch over approximately 2.5 days, including its React frontend, Supabase integration, authentication, and database functionality.

I later revisited the project to rebuild its backend, strengthen database security, expand its social features, and improve its overall engineering quality.

The project continues to evolve as I gain more experience with full-stack development, database design, application security, and performance optimization.

## 📄 License

License information will be finalized before public release.
