# Wander - Reverse Travel App for Students

## Product Overview
Mobile-first travel app where students enter dates + mood + budget and get 3 best matching destinations.

## Stack
- Frontend: React Native / Expo Router
- Backend: FastAPI + MongoDB
- Auth: Supabase
- APIs: Duffel (flights), RapidAPI Booking.com (hotels), Claude AI (via emergentintegrations)

## Completed Features
- [x] Home screen with date/mood/budget selection
- [x] Multi-factor scoring engine (searchAlgorithm.ts)
- [x] Real Duffel API flight search
- [x] Booking.com accommodation search
- [x] RSS deals aggregator (European feeds)
- [x] Supabase Auth (login/register/profile)
- [x] 6-step onboarding quiz
- [x] Intelligent soft budget
- [x] Detail screen with expandable flights, accommodation modal
- [x] Booking flow screen
- [x] AI Destinations endpoint (POST /api/ai/destinations) ✅ TESTED
- [x] AI Itinerary endpoint (POST /api/ai/itinerary) ✅ TESTED
- [x] European Subsidies endpoint (GET /api/subsidies/calculate) ✅ TESTED
- [x] Subsidies UI screen (app/subsidies.tsx)
- [x] AI Itinerary UI screen (app/itinerary/[id].tsx)
- [x] Saved Trips connected to Supabase (full CRUD)
- [x] SubsidyBadge in results.tsx
- [x] Toast notification component
- [x] Error handling in results (empty/error states)

## Pending
- [ ] Stripe Payment integration
- [ ] Bookings History
- [ ] Firebase Push Notifications
- [ ] Google/Apple Sign-In (OAuth)
