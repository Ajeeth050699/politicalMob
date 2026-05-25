# Admin Dashboard API Integration Guide

## ✅ Verified Backend Endpoints

All endpoints are fully functional and tested with admin role. No additional backend modifications required.

### 1. GET /api/complaints
**Purpose**: Fetch list of complaints with filtering
**Used by**: AdminComplaints.js screen

#### Supported Query Parameters
```
- status: 'NEW', 'ACCEPTED', 'IN PROGRESS', 'COMPLETED', 'ALL'
- district: 'ALL' or specific district name
- thokuthi: thokuthi name (admin-specific)
- ward: ward/constituency name (admin-specific)
- wardNo: ward number (admin-specific)
- pincode: postal code (admin-specific)
- category: complaint category
- workerId: filter by assigned worker ID
- workerName: search by worker name
```

#### Admin-Specific Behavior
- Admins with a district restriction see all complaints from their district
- Superadmins see all complaints
- Returns fields: id, category, status, user, thokuthi, ward, wardNo, district, pincode, assignedWorker, createdAt

#### Example Request
```javascript
GET /api/complaints?status=NEW&district=Chennai&ward=Mylapore
Header: Authorization: Bearer {jwt_token}
```

#### Response Structure
```json
[
  {
    "_id": "complaint_id",
    "category": "Street Light",
    "status": "NEW",
    "user": { "name": "User", "phone": "999..." },
    "thokuthi": "Thokuthi A",
    "ward": "Mylapore", 
    "wardNo": 1,
    "district": "Chennai",
    "assignedWorker": { "name": "Worker Name", "phone": "888..." },
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

---

### 2. GET /api/complaints/:id
**Purpose**: Fetch detailed complaint information
**Used by**: ComplaintDetailAdmin.js screen

#### Admin-Specific Behavior
- Admins can view complaints from their district
- Returns full complaint details including attachments

#### Example Response
```json
{
  "_id": "complaint_id",
  "category": "Street Light",
  "description": "Light is not working",
  "status": "ACCEPTED",
  "user": { "name": "Citizen", "phone": "999..." },
  "thokuthi": "Thokuthi A",
  "ward": "Mylapore",
  "wardNo": 1,
  "district": "Chennai", 
  "pincode": "60041",
  "address": "123 Main St",
  "assignedWorker": {
    "_id": "worker_id",
    "name": "Worker Name",
    "phone": "888...",
    "status": "active"
  },
  "attachments": [
    { "url": "/uploads/image.jpg", "type": "image" }
  ],
  "createdAt": "2024-01-15T10:30:00Z",
  "acceptedAt": "2024-01-15T10:45:00Z"
}
```

---

### 3. GET /api/workers
**Purpose**: Fetch list of workers with performance metrics
**Used by**: AdminWorkers.js screen

#### Supported Query Parameters
```
- district: 'ALL' or specific district name  
- search: search by name, thokuthi, or district
```

#### Admin-Specific Behavior
- Admins see workers in their district by default
- Can filter to see workers from specific district
- Returns computed statistics (resolved, pending counts)

#### Response Structure
```json
[
  {
    "id": "worker_id",
    "name": "Worker Name",
    "email": "worker@example.com",
    "phone": "888...",
    "role": "worker",
    "ward": "Mylapore",
    "wardNo": 1,
    "thokuthi": "Thokuthi A",
    "district": "Chennai",
    "pincode": "60041",
    "status": "active",
    "resolved": 15,
    "pending": 3,
    "rating": 4.5
  }
]
```

---

### 4. GET /system/wards
**Purpose**: Fetch list of all Tamil Nadu constituencies for dropdown filter
**Used by**: AdminComplaints.js and AdminWorkers.js

#### Response Structure
```json
{
  "count": 234,
  "wards": [
    "Mylapore",
    "Chennai South",
    "Madras Central",
    ...
  ]
}
```

#### Usage in Mobile App
- Populates thokuthi dropdown
- Admin's district defaults to their own ward/constituency
- Can switch to 'ALL' to see all complaints/workers

---

## 🔐 Role-Based Access Control

### Admin Role Access
- Can view all complaints within their district
- Can filter complaints by status, category, thokuthi, ward
- Can view all workers in their district
- Can view worker performance metrics
- Can download worker lists as CSV

### Superadmin Role Access  
- Can view all complaints from all districts
- Can filter complaints without district restrictions
- Can view all workers from all districts
- Full system access

### Authentication
- All endpoints require valid JWT token in Authorization header
- Token should be in format: `Bearer {jwt_token}`
- AuthMiddleware validates token and populates `req.user` with role information

---

## ⚙️ Mobile App Integration Checklist

### ✅ Imports
- [x] complaintAPI in AdminComplaints.js
- [x] workerAPI in AdminWorkers.js
- [x] systemAPI.getWards() in both screens

### ✅ Authentication
- [x] JWT token automatically added by axios interceptor in api.js
- [x] AsyncStorage provides stored token
- [x] AuthContext provides userInfo with role

### ✅ Filter Parameters
- [x] AdminComplaints sends: status, district/ward, search query
- [x] AdminWorkers sends: district, search query
- [x] Backend accepts and processes all parameters

### ✅ Error Handling
- [x] Try-catch blocks wrap all API calls
- [x] PopupToast component shows error messages
- [x] RefreshControl allows retry on failure

### ✅ Data Display
- [x] Complaint list with worker status badges
- [x] Worker cards with performance metrics  
- [x] CSV download using Share API

---

## 🚀 Testing the Integration

### 1. Create Admin Account
```bash
# Via API
POST /api/auth/register
{
  "name": "Admin Name",
  "email": "admin@example.com",
  "phone": "99999999999",
  "password": "password",
  "role": "admin",
  "district": "Chennai",
  "thokuthi": "Thokuthi A"
}
```

### 2. Login with Admin Account
- Mobile app will automatically route to AdminTabs
- AdminDashboard loads stats from /api/complaints and /api/workers

### 3. Test Complaints Filter
- Switch thokuthi dropdown (fetches from /system/wards)
- Change status filter (sends to /api/complaints?status=...)
- Search by description (client-side filtering)

### 4. Test Workers View
- Verify worker list loads with performance metrics
- Filter by district
- Download CSV and verify formatting

### 5. Test Complaint Details
- Click complaint to view full details
- Verify worker acceptance status displays correctly

---

## 🔍 Debugging Tips

### Common Issues

**Error: 404 Not Found on /api/complaints**
- Ensure base URL is correct (check Constants.expoConfig in app.json)
- Verify server is running on port 5003
- Check CORS settings in server.js

**Error: 401 Unauthorized**
- Ensure JWT token is valid and not expired
- Check token is being sent in Authorization header
- Verify user role is 'admin' or 'superadmin'

**Complaints list is empty**
- Verify admin's district matches complaint district
- Check if complaints with this district exist in database
- Try filtering with district='ALL' (if superadmin)

**Workers list shows no performance metrics**
- Ensure Complaint model has assignedWorker relationship
- Verify workers have complaints assigned
- Check console logs for aggregation errors

### Enable Debug Logging
```javascript
// In api.js, add before API calls:
console.log('Request:', config);  // Add in interceptor
console.log('Response:', response.data);  // Add after API call
```

---

## 📊 Database Models

### User (Worker/Admin)
```
- name: String
- email: String (unique)
- phone: String (unique)
- role: 'worker', 'admin', 'superadmin'
- ward: String (constituency)
- wardNo: Number
- thokuthi: String
- district: String
- pincode: String
- isActive: Boolean
```

### Complaint
```
- category: String
- description: String
- status: 'NEW', 'ACCEPTED', 'IN PROGRESS', 'COMPLETED'
- user: ObjectId (ref: User)
- assignedWorker: ObjectId (ref: User)
- thokuthi: String
- ward: String
- wardNo: Number
- district: String
- pincode: String
- address: String
- attachments: Array
- createdAt: Date
- acceptedAt: Date
```

---

## 📝 Notes

- All timestamps are in UTC
- Sorting is by createdAt descending (newest first)
- Admin filtering is applied server-side for security
- Passwords are not returned in any API response
- File uploads (attachments) use multipart/form-data

---

**Last Updated**: 2024
**Status**: All endpoints verified and operational
