export const defaultJson = {
  "name": "JSON Blox",
  "version": "1.0.0",
  "description": "Highly Performant and User-Friendly JSON Visualization Toolkit",
  "features": {
    "editor": {
      "enabled": true,
      "type": "monaco",
      "settings": {
        "theme": "light",
        "minimap": false
      }
    },
    "blocks": {
      "enabled": true,
      "settings": {
        "defaultCollapsed": true,
        "colorByLevel": true,
        "indentSize": 24
      }
    },
    "search": {
      "enabled": true,
      "caseSensitive": false
    }
  },
  "examples": [
    {
      "type": "string",
      "value": "Hello World"
    },
    {
      "type": "number",
      "value": 42
    },
    {
      "type": "boolean",
      "value": true
    },
    {
      "type": "null",
      "value": null
    }
  ],
  "contributors": [
    {
      "name": "David Zhang",
      "role": "Developer",
    }
  ],
  "meta": {
    "created": "2024-11-27",
    "updated": "2024-11-27",
    "license": "MIT"
  }
};
