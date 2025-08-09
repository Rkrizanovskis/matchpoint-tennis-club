# Confetti Effects Implementation

The Matchpoint Tennis Club website now includes celebratory confetti effects that trigger when users perform certain actions.

## When Confetti Triggers

1. **Adding a New Player** 🎉
   - When a new player is successfully added to the club
   - Uses the "playerAdded" confetti configuration
   - Every 10th player gets bonus fireworks!

2. **Booking a Session** ✅
   - When a player is successfully booked for a training session
   - Uses the "bookingSuccess" configuration (green-themed)
   - First booking of the week gets extra side burst effects
   - When a session becomes fully booked, triggers "Club Pride" effect

3. **Posting to Club Wall** 💬
   - When a message is successfully posted to the club wall
   - Confetti bursts from the post button location

## Available Confetti Types

- **playerAdded**: Medium burst with tennis-themed colors
- **bookingSuccess**: Green-themed success celebration
- **tennisVictory**: Big celebration with tennis ball colors (yellow/green)
- **sideBurst**: Confetti from both sides of the screen
- **clubPride**: Continuous streams in club colors (blue/white)
- **realistic**: Multi-layered realistic confetti burst
- **fireworks**: 3-second firework display

## Testing

Visit `confetti-demo.html` to test all available confetti effects.

## Technical Details

- Uses `canvas-confetti` library (loaded from CDN)
- Confetti appears above all other elements (z-index: 9999)
- Fully integrated with existing functionality
- No additional dependencies required

## Customization

To customize confetti effects, edit the configurations in `js/confetti.js`. You can adjust:
- Particle count
- Colors
- Spread and angle
- Gravity and velocity
- Duration (ticks)
- Origin position
