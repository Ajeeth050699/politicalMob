# Notification System - Integration & Testing Guide

## 🎯 System Overview

The notification system has been fully implemented across all platforms:
- **Backend**: Express API with MongoDB
- **Mobile App**: React Native with Expo
- **Web Admin**: React dashboards (super-admin-web, web-admin)

## 📱 Mobile App Navigation Changes

### Public User Tabs (Bottom Navigation)
- Home
- Complaints
- **Notifications** ← NEW
- News
- Emergency

### Worker Tabs (Bottom Navigation)
- Dashboard
- Complaints
- **Notifications** ← NEW (replaces Videos)
- News
- Profile

### Admin Tabs (Bottom Navigation)
- Dashboard
- Complaints
- **Notifications** ← NEW
- Workers
- Profile

## 🔌 API Endpoints Reference

### Base URL
```
http://api-server:port/api/notifications
```

### Get All Notifications
```
GET /api/notifications
Query Parameters:
  - type: "complaint" | "worker" | "camp" | "news" | "announcement" | "ALL"
  - status: "unread" | "read" | "archived" | "ALL"
  - page: number (default: 1)
  - limit: number (default: 20)

Response:
{
  success: true,
  data: [
    {
      _id: ObjectId,
      userId: ObjectId,
      title: string,
      message: string,
      type: string,
      status: "unread" | "read" | "archived",
      relatedComplaintId: ObjectId,
      relatedWorkerId: ObjectId,
      actionUrl: string,
      createdAt: ISO8601,
      updatedAt: ISO8601
    }
  ],
  pagination: { total, page, pages }
}
```

### Get Notification Details
```
GET /api/notifications/:id

Response:
{
  success: true,
  data: {
    _id: ObjectId,
    // ... notification object ...
    // NOTE: Automatically marks as "read" on fetch
  }
}
```

### Mark as Read
```
PUT /api/notifications/:id/read

Response:
{
  success: true,
  data: { /* updated notification */ }
}
```

### Archive Notification
```
PUT /api/notifications/:id/archive

Response:
{
  success: true,
  data: { /* archived notification */ }
}
```

### Create Notification (Admin Only)
```
POST /api/notifications
Body: {
  userId: ObjectId,
  title: string,
  message: string,
  type: "announcement",
  actionUrl: string (optional)
}

Response:
{
  success: true,
  data: { /* created notification */ }
}
```

## 📲 Testing Scenarios

### Scenario 1: Basic Notification Flow
**Objective**: Verify citizen receives notification when filing complaint

**Steps**:
1. Login as citizen/public user
2. Navigate to "Complaints" tab
3. File a new complaint
4. Navigate to "Notifications" tab
5. **Expected**: Should see a notification about complaint creation

**Verification**:
- ✅ Notification appears in list
- ✅ Type badge shows correctly
- ✅ Timestamp shows "just now"
- ✅ Status is "unread"
- ✅ Can click to view details

### Scenario 2: Worker Notification
**Objective**: Verify workers receive notification for new complaints in their ward

**Steps**:
1. Login as worker
2. Check "Notifications" tab
3. Should see recently filed complaints
4. Click on a complaint notification
5. **Expected**: Opens notification detail with complaint info

**Verification**:
- ✅ Notification shows complaint details
- ✅ "View Full Complaint" button works
- ✅ Can mark as read/archive
- ✅ Worker info appears if applicable

### Scenario 3: Filtering
**Objective**: Verify notification filters work correctly

**Steps**:
1. Navigate to Notifications tab
2. Select filter "complaint" from type dropdown
3. **Expected**: Only complaint notifications visible
4. Select status "read"
5. **Expected**: Only read notifications visible
6. Clear filters (select "ALL")
7. **Expected**: All notifications visible

**Verification**:
- ✅ Type filter works (complaint/news/camp/announcement)
- ✅ Status filter works (unread/read/all)
- ✅ Combined filters work
- ✅ Pagination loads more on scroll

### Scenario 4: Admin Dashboard
**Objective**: Verify admin sees recent notifications on dashboard

**Steps**:
1. Login as admin/superadmin
2. Navigate to "Dashboard" tab
3. Scroll to "Recent Activity" section
4. **Expected**: See 3 most recent notifications

**Verification**:
- ✅ Recent notifications display
- ✅ Click on notification opens detail
- ✅ "See All" link navigates to notifications page
- ✅ Unread indicator shows count

### Scenario 5: Admin Notifications Page
**Objective**: Verify dedicated admin notifications page works

**Steps**:
1. Login as admin
2. Navigate to "Notifications" tab (new bottom tab)
3. Should see all notifications with admin-specific view
4. Filter by type and status
5. Click on notification for details

**Verification**:
- ✅ Notifications page shows all admin notifications
- ✅ Filters work correctly
- ✅ Unread badge shows count
- ✅ Can navigate to related complaints

### Scenario 6: Mark as Read
**Objective**: Verify mark as read functionality

**Steps**:
1. Open notification detail screen
2. Check status (should be "unread")
3. Auto-read on view occurs
4. Navigate away and back
5. **Expected**: Status shows "read"

**Verification**:
- ✅ Notification marked as read when opened
- ✅ Status badge updates
- ✅ Opacity/styling changes for read items

### Scenario 7: Archive Notification
**Objective**: Verify archive removes from active list

**Steps**:
1. Open notification detail
2. Tap "Archive" button
3. Navigate back to list
4. **Expected**: Notification removed from active list
5. Filter by status "archived"
6. **Expected**: Archived notification appears

**Verification**:
- ✅ Archive removes from unread/read list
- ✅ Can still see archived notifications with filter
- ✅ Archived status is persistent

### Scenario 8: Complaint Status Update Flow
**Objective**: Verify citizen receives updates when complaint status changes

**Steps**:
1. File complaint as citizen
2. Login as worker
3. Accept complaint
4. Switch back to citizen
5. Check Notifications
6. **Expected**: See "Accepted" notification
7. Worker updates status to "IN PROGRESS"
8. Check notifications again
9. **Expected**: See "IN PROGRESS" notification

**Verification**:
- ✅ Notifications sent on status change
- ✅ Message reflects current status
- ✅ Related complaint accessible from notification

## 🛠️ Troubleshooting

### Issue: Notifications not appearing
**Solution**:
1. Check backend is running: `npm start` in `/api-server`
2. Verify notification routes are registered
3. Check AsyncStorage has valid JWT token
4. Review backend logs for errors

### Issue: Filters not working
**Solution**:
1. Verify query parameters are being sent: Check network tab
2. Check backend endpoint accepts parameters
3. Verify MongoDB query is correct

### Issue: Navigation not working
**Solution**:
1. Verify screens registered in AppNavigator.js
2. Check screen names match navigation parameters
3. Verify navigation prop passed to screens

### Issue: Styling issues
**Solution**:
1. Verify theme constants are imported
2. Check LinearGradient is properly installed
3. Verify platform-specific styling

## 📊 Monitoring & Logging

### Backend Logging
Check API server logs:
```bash
cd packages/api-server
npm start
# Look for notification-related logs
```

### Mobile Logging
Use React Native debugger:
```bash
# In terminal during Expo app run
adb logcat | grep notification
```

### Database Verification
```javascript
// Connect to MongoDB
use politicalMob
db.notifications.find().pretty()
db.notifications.countDocuments()
db.notifications.find({ status: "unread" }).count()
```

## 🚀 Performance Optimization Tips

1. **Pagination**: Always use pagination in production (limit: 20)
2. **Filtering**: Filter on backend, not frontend
3. **Caching**: Consider caching notification list
4. **Real-time**: Use Socket.io for instant updates (future)
5. **Archive cleanup**: Periodically archive old notifications

## 📋 Deployment Checklist

- [ ] Backend notification routes deployed
- [ ] Notification model updated in MongoDB
- [ ] Mobile app rebuilt and deployed
- [ ] Navigation changes tested on all user roles
- [ ] Notification detail screens working
- [ ] Filtering tested on multiple datasets
- [ ] Admin dashboard notifications showing
- [ ] Mark as read/archive working
- [ ] Error handling verified
- [ ] Performance tested with large datasets

## 🔒 Security Notes

- ✅ Only users receive their notifications
- ✅ JWT validation required for all endpoints
- ✅ Users can only archive their own notifications
- ✅ Admin-only endpoints protected
- ✅ No notification content exposed in list view (unless complaint linked)

## 📞 Support

For issues or questions:
1. Check NOTIFICATION_SYSTEM_DOCS.md for full feature list
2. Review this testing guide for common scenarios
3. Check backend logs for API errors
4. Verify AsyncStorage JWT token availability
