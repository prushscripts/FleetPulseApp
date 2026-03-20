/**
 * Loads FleetPulseApp/.env into process.env before Expo reads config.
 * Values are also copied to expo.extra so they work at runtime even if Metro inlining fails.
 */
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env') })

const { expo } = require('./app.json')

module.exports = {
  expo: {
    ...expo,
    extra: {
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      EXPO_PUBLIC_WEB_URL: process.env.EXPO_PUBLIC_WEB_URL,
    },
  },
}
