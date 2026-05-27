# Web Admin Notification Filtering Guide

## Overview
The web admin dashboards (super-admin-web and web-admin) need notification filtering improvements. This guide helps implement or troubleshoot notification filters.

## Current Status
- Located: `src/pages/Dashboard.jsx` (PageNotifications function around lines 4430-4870)
- Features needed: Type filter, Status filter, Date range filter
- CSS: Needs improvement for better UX

## Filter Implementation Checklist

### 1. Filter State Management
```javascript
const [filters, setFilters] = useState({
  type: 'ALL',        // ALL | complaint | worker | camp | news | announcement
  status: 'ALL',      // ALL | unread | read | archived
  dateFrom: null,     // ISO date or null
  dateTo: null,       // ISO date or null
  page: 1,
  limit: 20
});
```

### 2. Filter UI Components
Create filter chips/dropdowns for:
- **Type Filter**: Dropdown with options (ALL, complaint, worker, camp, news, announcement)
- **Status Filter**: Dropdown with options (ALL, unread, read, archived)
- **Date Range**: Date pickers for from/to dates
- **Clear Filters**: Button to reset all filters
- **Apply Filters**: Button to trigger API call

### 3. API Call with Filters
```javascript
const fetchNotifications = async () => {
  try {
    const params = new URLSearchParams();
    
    if (filters.type !== 'ALL') params.append('type', filters.type);
    if (filters.status !== 'ALL') params.append('status', filters.status);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    params.append('page', filters.page);
    params.append('limit', filters.limit);
    
    const response = await fetch(
      `/api/notifications?${params.toString()}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    const data = await response.json();
    setNotifications(data.data);
    setPagination(data.pagination);
  } catch (error) {
    console.error('Error fetching notifications:', error);
  }
};
```

### 4. CSS Improvements

#### Filter Container
```css
.notification-filters {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-select:hover {
  border-color: #666;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.filter-select:focus {
  outline: none;
  border-color: #8b0000;
  box-shadow: 0 0 0 3px rgba(139, 0, 0, 0.1);
}

.filter-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: #8b0000;
  color: white;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}

.filter-btn:hover {
  background: #a50000;
}

.filter-btn.clear {
  background: #666;
}

.filter-btn.clear:hover {
  background: #888;
}
```

#### Notification List
```css
.notification-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid #eee;
  transition: background 0.2s;
}

.notification-item:hover {
  background: #f9f9f9;
}

.notification-item.unread {
  background: #f0f0f0;
  font-weight: 600;
}

.notification-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.notification-badge.complaint {
  background: #ffe0e0;
  color: #8b0000;
}

.notification-badge.worker {
  background: #e0f0ff;
  color: #0066cc;
}

.notification-badge.news {
  background: #fff0e0;
  color: #cc6600;
}

.notification-badge.camp {
  background: #e0ffe0;
  color: #00aa00;
}

.notification-badge.announcement {
  background: #f0e0ff;
  color: #6600cc;
}

.notification-status {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;
}

.notification-status.unread {
  background: #8b0000;
}

.notification-status.read {
  background: #ccc;
}

.notification-status.archived {
  background: #999;
}
```

#### Empty State
```css
.notification-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: #666;
}

.notification-empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.notification-empty-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.notification-empty-message {
  font-size: 14px;
  color: #999;
}
```

### 5. Pagination
```css
.pagination {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
  padding: 20px;
}

.pagination-btn {
  padding: 8px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  border-color: #8b0000;
  color: #8b0000;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-btn.active {
  background: #8b0000;
  color: white;
  border-color: #8b0000;
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 14px;
}
```

## Implementation Steps

1. **Identify Filter Component**
   - Locate PageNotifications function in Dashboard.jsx
   - Find where notifications are displayed

2. **Add Filter State**
   - Import useState hook
   - Create filter state object

3. **Create Filter UI**
   - Add filter controls section above notification list
   - Use dropdowns for type/status
   - Add date pickers if needed

4. **Connect to API**
   - Update fetch call to include filter parameters
   - Handle loading/error states
   - Update pagination

5. **Style Components**
   - Apply CSS classes from above
   - Test responsive design
   - Verify color contrast

6. **Test Filtering**
   - Test each filter individually
   - Test combined filters
   - Test pagination with filters
   - Test empty states

## Common Issues & Solutions

### Issue: Filter changes not reflecting
**Solution**: Ensure API call is triggered on filter change
```javascript
useEffect(() => {
  fetchNotifications();
}, [filters]);
```

### Issue: Pagination not working with filters
**Solution**: Reset page to 1 when filters change
```javascript
const handleFilterChange = (newFilter) => {
  setFilters({ ...newFilter, page: 1 });
};
```

### Issue: Date filter not working
**Solution**: Ensure backend supports dateFrom/dateTo parameters
```javascript
// Backend should support:
GET /api/notifications?dateFrom=2024-01-01&dateTo=2024-12-31
```

### Issue: Styling not applied
**Solution**: Verify CSS classes are correctly named and imported
- Check className spelling
- Verify CSS file is imported
- Use browser DevTools to inspect

## Future Enhancements

1. **Real-time Updates**: Use Socket.io for instant notifications
2. **Search**: Add full-text search for notification messages
3. **Advanced Filtering**: Add date range picker
4. **Bulk Actions**: Select multiple and archive/delete
5. **Export**: Export notifications to CSV
6. **Notifications Sound**: Audio alert for new notifications
7. **Dark Mode**: Support for dark theme

## Testing Checklist

- [ ] Type filter works (complaint, worker, camp, news, announcement)
- [ ] Status filter works (unread, read, archived)
- [ ] Date range filter works (if implemented)
- [ ] Multiple filters together work
- [ ] Pagination works with filters
- [ ] Clear filters button resets all
- [ ] Empty state displays correctly
- [ ] Loading state displays during fetch
- [ ] Error state displays on failure
- [ ] UI is responsive on mobile devices
- [ ] Styling matches design system
- [ ] Performance is acceptable with large datasets

## API Query Examples

```bash
# Get unread complaints
GET /api/notifications?type=complaint&status=unread

# Get all announcements
GET /api/notifications?type=announcement

# Get read notifications paginated
GET /api/notifications?status=read&page=2&limit=20

# Get unread items for current page
GET /api/notifications?status=unread&page=1&limit=50
```
