# Season Template Implementation - Phase 1 Complete

## 🎯 Objective
Implement a system where the week of Sep 30 - Oct 3, 2024 serves as the default player setup for all future weeks. Changes made to any specific week only affect that week, not the template.

## ✅ What's Been Implemented

### 1. **Season Template Storage (Firebase)**
- New collection: `seasonTemplate`
- Document ID: `default`
- Structure:
  ```javascript
  {
    tuesday: {
      '20:00-21:00': { players: [...], instructor: 'Paša' },
      '21:00-22:00': { players: [...], instructor: 'Paša' }
    },
    thursday: {
      '20:00-21:00': { players: [...], instructor: 'Justīne' },
      '21:00-22:00': { players: [...], instructor: 'Justīne' }
    },
    createdAt: <timestamp>,
    sourceWeek: "2024-09-30"
  }
  ```

### 2. **Core Functions Added**

#### `getSeasonTemplate()`
- Loads the season template from Firebase
- Returns null if no template exists
- Used during week initialization

#### `saveSeasonTemplate(weekOffset)`
- Captures current week's schedule data
- Saves it as the season template
- Records source week for reference
- Console accessible for admin use

#### `initializeWeekSchedule(weekOffset)` - MODIFIED
- Now checks for existing season template
- If template exists, uses it for new weeks
- If no template, creates empty slots (original behavior)
- Existing week data is never overwritten

### 3. **Template Manager Tool**
Created `template-manager.html` - A dedicated admin interface for:
- Saving current week as template
- Viewing current template data
- Testing how future weeks will be initialized
- All operations with visual feedback

## 🔧 How It Works

### Current Week (Sep 30 - Oct 3)
1. Already has player bookings in Firebase
2. Can be saved as template using template manager
3. Changes to this week only affect this week

### Future Weeks
1. When navigating to a new week (e.g., Oct 7-10):
   - System checks if that week exists in Firebase
   - If NOT exists: Loads template and creates slots with template players
   - If EXISTS: Uses existing data (preserves any changes)
2. Users can modify future weeks normally
3. Modifications are saved to that specific week only

### Template Updates
- Template can be updated anytime via template-manager.html
- Updates only affect future weeks that haven't been initialized yet
- Already initialized weeks keep their data

## 📁 Files Modified

1. **script-firebase.js**
   - Added season template functions
   - Modified `initializeWeekSchedule()` to use template
   - Exposed functions globally

2. **index.html**
   - No changes needed (admin panel not used)

3. **template-manager.html** (NEW)
   - Standalone admin tool for template management

## 🚀 Testing Locally

### Step 1: Start Server
```bash
cd /Users/ricardskrizanovskis/matchpoint-tennis-github
python3 -m http.server 8001
```

### Step 2: Open Template Manager
```
http://localhost:8001/template-manager.html
```

### Step 3: Save Current Week as Template
1. Click "Save Current Week as Template"
2. Verify success message
3. Click "Show Current Template" to view

### Step 4: Test Main App
```
http://localhost:8001
```
- Login with: `30:Love`
- Navigate to next week (Oct 7-10)
- Should show same players as current week

## 🧪 Test Scenarios

### Scenario 1: Save Template
1. Open template-manager.html
2. Click "Save Current Week as Template"
3. Expected: Success message + template data displayed

### Scenario 2: View Template
1. Click "Show Current Template"
2. Expected: Shows Tuesday/Thursday slots with players

### Scenario 3: Test Future Week
1. Click "Initialize Next Week (Should Use Template)"
2. Expected: Shows what would be created for next week
3. Should indicate "usedTemplate: true" if template exists

### Scenario 4: Main App - Next Week
1. Open main app (index.html)
2. Login and navigate to next week
3. Expected: Players from template automatically populated
4. Make changes and save
5. Navigate back and forward - changes should persist

### Scenario 5: Template Updates
1. Modify current week in main app
2. Save it as new template
3. Navigate to a fresh future week
4. Expected: New template players appear

## 🔍 Console Commands (Advanced)

Available in browser console on main app:

```javascript
// Save current week as template
await saveSeasonTemplate(0);

// View template
const template = await getSeasonTemplate();
console.log(template);

// Test with different week offset
await saveSeasonTemplate(1); // Save next week as template
```

## ⚠️ Important Notes

1. **Existing Weeks Preserved**: Template only affects NEW weeks that haven't been initialized
2. **Week-Specific Changes**: Any changes to a specific week are saved to that week only
3. **Template Updates**: Updating template doesn't change already-initialized weeks
4. **Backward Compatible**: If no template exists, system works as before (empty slots)

## 📊 Firebase Collections

### schedules
- Stores actual week-by-week bookings
- Format: `2024-10-01-tuesday-20:00-21:00`
- Never modified by template system after creation

### seasonTemplate
- Single document: `default`
- Stores the template data
- Updated manually via template manager

### players
- Unchanged
- Still stores player list

## ✨ Benefits

1. **No Repetitive Work**: Players don't repeat same bookings every week
2. **Flexibility**: Each week can be customized independently
3. **Easy Template Updates**: Change template anytime through manager
4. **Backward Compatible**: Works with existing data
5. **Admin Control**: Template managed by you, not visible to users

## 🎯 Next Steps

1. **Test locally** - Verify all scenarios work
2. **Save initial template** - Use current week data
3. **Test week navigation** - Ensure template applies correctly
4. **Deploy to production** - Once local testing passes
5. **Monitor first week** - Check that players see correct defaults

## 📝 Deployment Checklist

- [ ] Local testing complete
- [ ] Template saved from current week (Sep 30-Oct 3)
- [ ] Tested navigation to future weeks
- [ ] Verified template is applied
- [ ] Tested making changes to specific weeks
- [ ] Checked that changes don't affect template
- [ ] Ready to deploy to matchpoint.lv

---

**Status**: ✅ Phase 1 Implementation Complete - Ready for Local Testing
**Server Running**: http://localhost:8001
**Template Manager**: http://localhost:8001/template-manager.html
**Main App**: http://localhost:8001
