# Better Combat Bars - Alt1 Plugin

An enhanced combat bars overlay for RuneScape that provides better visibility and customization options for your HP, Prayer, Adrenaline, and Summoning bars.

## Features

- 🎯 **Enhanced Combat Bars**: Improved visibility for HP, Prayer, Adrenaline, and Summoning
- 🎨 **Full Customization**: Customize colors, sizes, positions, and transparency
- 📱 **Flexible Layouts**: Choose between horizontal and vertical bar layouts
- ⚠️ **Low HP Warnings**: Visual alerts when your health drops below configurable thresholds
- 👁️ **Auto-Hide Options**: Automatically hide bars when they're full
- 🎮 **Keybind Support**: Quick access to customization settings
- 💾 **Persistent Settings**: Your customizations are automatically saved

## Installation

### Prerequisites
- [Alt1 Toolkit](https://runeapps.org/alt1) must be installed on your computer

### Method 1: Direct Installation (Recommended)
1. Open Alt1 Toolkit
2. Click the "+" button to add a new app
3. Enter the app URL: `https://xbenjii.github.io/alt1-better-combat-bars/`
4. The plugin will be automatically added to your Alt1 apps list

### Method 2: Manual Installation
1. Download the latest release from the [releases page](https://github.com/xbenjii/alt1-better-combat-bars/releases)
2. Extract the files to a folder
3. In Alt1 Toolkit, click "+" → "Load App from Folder"
4. Navigate to and select the extracted folder

## How to Use

### Initial Setup
1. **Launch the App**: Click on "Better Combat Bars" in your Alt1 apps list
2. **Position the Overlay**: Drag the overlay window to your preferred location on screen
3. **Resize if Needed**: Use the window borders to resize the overlay to your liking

### Basic Usage
The overlay automatically detects and displays your current:
- **HP (Health Points)**: Shows current/max HP with customizable low-health warnings
- **Prayer Points**: Displays current/max prayer points
- **Adrenaline**: Shows adrenaline percentage (0-100%)
- **Summoning**: Displays current/max summoning points

### Customization

#### Opening Settings
- Click the "Settings" button in the overlay window, or
- Use the configurable keybind (default: Ctrl + Alt + C)

#### Available Customizations

**Layout Options:**
- **Orientation**: Choose between horizontal or vertical bar layouts
- **Bar Dimensions**: Adjust width and height of individual bars
- **Spacing**: Control the gap between bars

**Visual Settings:**
- **Colors**: Customize colors for each bar type (HP, Prayer, Adrenaline, Summoning)
- **Low HP Color**: Set a different color when HP drops below threshold
- **Transparency**: Adjust overall overlay opacity (0-100%)
- **Themes**: Choose from predefined color themes or create your own

**Behavior Options:**
- **Low HP Threshold**: Set the percentage at which HP bar changes color (default: 25%)
- **Hide When Full**: Automatically hide bars when they reach maximum value
- **Update Frequency**: Adjust how often the overlay refreshes (affects performance)

**Position & Size:**
- **Lock Position**: Prevent accidental movement of the overlay
- **Always on Top**: Keep overlay above other windows
- **Snap to Grid**: Enable grid-based positioning for precise alignment

### Keybinds
Configure keyboard shortcuts for quick access:
- **Toggle Settings**: Default Ctrl + Alt + C
- **Toggle Overlay**: Default Ctrl + Alt + V
- **Reset Position**: Default Ctrl + Alt + R

## Troubleshooting

### Overlay Not Detecting Stats
1. **Check Game Interface**: Ensure your combat stats are visible on screen
2. **Interface Scale**: Make sure RuneScape's interface scaling is supported
3. **Overlay Position**: The overlay needs to be able to "see" your stats bars
4. **Alt1 Permissions**: Verify Alt1 has screen capture permissions

### Performance Issues
1. **Update Frequency**: Reduce the update frequency in settings
2. **Hide Unused Bars**: Disable bars you don't need
3. **Lower Transparency**: Reduce overlay complexity by using solid colors

### Settings Not Saving
1. **Browser Permissions**: Ensure local storage is enabled
2. **Alt1 Version**: Update to the latest Alt1 Toolkit version
3. **Clear Cache**: Try clearing the app's cache and reconfiguring

### Common Solutions
- **Restart Alt1**: Close and reopen Alt1 Toolkit
- **Reload App**: Right-click the app and select "Reload"
- **Reset Settings**: Use the "Reset to Defaults" button in settings

## Development

### Building from Source
```bash
# Clone the repository
git clone https://github.com/xbenjii/alt1-better-combat-bars.git
cd alt1-better-combat-bars

# Install dependencies
yarn install

# Start development server
yarn dev

# Build for production
yarn build
```

### Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

- **Issues**: Report bugs on [GitHub Issues](https://github.com/xbenjii/alt1-better-combat-bars/issues)
- **Discussions**: Join discussions on [GitHub Discussions](https://github.com/xbenjii/alt1-better-combat-bars/discussions)
- **Alt1 Community**: Get help on the [Alt1 Discord](https://discord.gg/alt1)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with the [Alt1 Toolkit](https://runeapps.org/alt1)
- Uses React and TypeScript for modern web development

---

**Note**: This is an unofficial third-party tool and is not affiliated with Jagex or RuneScape. Use at your own discretion and in accordance with RuneScape's rules.git