# Functional Requirements: Signup Application

This document outlines the functional requirements for the Signup Application, a platform for scheduling time slots with Discord-based authentication and authorization.

## 1. Authentication & Authorization
- **Discord OAuth2**: The application must support user authentication via Discord using the **BetterAuth** library.
- **Role-Based Access Control (RBAC)**:
    - User permissions must be derived from roles assigned in a specific Discord server (guild).
    - Permissions include:
        - **Regular User**: Ability to sign up for available slots and unassign themselves from their own claimed slots.
        - **Administrator**: Full control over all slots, including the ability to unassign any user from any slot.
- **Session Management**: Secure persistent sessions must be maintained for authenticated users.

## 2. Schedule Table Interface
- **Rolling Weekly View**:
    - The table must display a rolling 7-day window, starting with the current day.
    - Columns represent individual days.
- **Time Slot Rows (Variable Increments)**:
    - **12:00 AM – 4:00 PM**: Displayed in **1-hour** increments.
    - **4:00 PM – 12:00 AM**: Displayed in **2-hour** single blocks (e.g., 4PM-6PM, 6PM-8PM, 8PM-10PM, 10PM-12AM).
- **Timezone Support**: All times must be displayed in the user's **local time**.
- **Slot Status Indicators**:
    - **Available**: The slot is open for assignment.
    - **Claimed by Current User**: Indicates the slot is taken by the logged-in user.
    - **Occupied**: Indicates the slot is taken by another user (displaying their Discord name/avatar).

## 3. Slot Management Features
- **Assignment**: Authenticated users can select an "Available" slot to assign themselves to that time block.
- **Unassignment (Self)**: Users can release slots they have previously claimed.
- **Unassignment (Admin)**: Administrators have the authority to remove any user from any assigned slot.
- **No Claims Limit**: There is currently no restriction on the number of slots a single user can claim.
- **Conflict Prevention**: The system must prevent multiple users from claiming the same slot simultaneously.

## 4. Data Persistence & Performance
- **Database**: Use **PostgreSQL** to store user information, session data, and slot assignments.
- **Optimistic UI**: The interface should ideally provide immediate feedback when claiming or unclaiming a slot, followed by background synchronization with the server.

---

## 5. Future Considerations & Clarifications
- **Discord Configuration**: Specific Guild ID and Client ID/Secret will be required for implementation.
- **Role Mapping**: The exact mapping of Discord role IDs to application permissions will be defined during the implementation phase.
- **Real-time Updates**: Potential for WebSocket-based updates to reflect schedule changes across all active clients without refresh.
