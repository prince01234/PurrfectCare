import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { Strategy as GitHubStrategy } from "passport-github2";
import User from "../models/User.js";
import config from "./config.js";

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: config.oauth.google.clientId,
      clientSecret: config.oauth.google.clientSecret,
      callbackURL: config.oauth.google.callbackURL,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const { id, displayName, emails, photos } = profile;
        const email = emails?.[0]?.value;
        const profilePicture = photos?.[0]?.value;

        // Check if user exists by Google ID
        let user = await User.findOne({ googleId: id });

        if (!user) {
          // Check if email already exists
          user = await User.findOne({ email });

          if (user) {
            // Link Google ID to existing account
            user.googleId = id;
            if (!user.authProviders.includes("google")) {
              user.authProviders.push("google");
            }
            user.socialProfile = {
              displayName,
              profilePicture,
              provider: "google",
            };
            await user.save();
          } else {
            // Create new user
            user = new User({
              email,
              googleId: id,
              name: displayName || email?.split("@")[0],
              profileImage: profilePicture,
              authProviders: ["google"],
              isVerified: true, // Auto-verify users from OAuth providers
              socialProfile: {
                displayName,
                profilePicture,
                provider: "google",
              },
            });
            await user.save();
          }
        } else if (user && !user.authProviders.includes("google")) {
          // Update existing user to include google provider
          user.authProviders.push("google");
          user.socialProfile = {
            displayName,
            profilePicture,
            provider: "google",
          };
          await user.save();
        }

        done(null, user);
      } catch (error) {
        done(error, null);
      }
    },
  ),
);

// Facebook OAuth Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: config.oauth.facebook.appId,
      clientSecret: config.oauth.facebook.appSecret,
      callbackURL: config.oauth.facebook.callbackURL,
      profileFields: ["id", "displayName", "email", "photos"],
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const { id, displayName, emails, photos } = profile;
        const email = emails?.[0]?.value;
        const profilePicture = photos?.[0]?.value;

        // Check if user exists by Facebook ID
        let user = await User.findOne({ facebookId: id });

        if (!user) {
          // Check if email already exists
          user = await User.findOne({ email });

          if (user) {
            // Link Facebook ID to existing account
            user.facebookId = id;
            if (!user.authProviders.includes("facebook")) {
              user.authProviders.push("facebook");
            }
            user.socialProfile = {
              displayName,
              profilePicture,
              provider: "facebook",
            };
            await user.save();
          } else {
            // Create new user
            user = new User({
              email: email || `fb_${id}@purrfectcare.local`,
              facebookId: id,
              name: displayName || "Facebook User",
              profileImage: profilePicture,
              authProviders: ["facebook"],
              isVerified: email ? true : false,
              socialProfile: {
                displayName,
                profilePicture,
                provider: "facebook",
              },
            });
            await user.save();
          }
        } else if (user && !user.authProviders.includes("facebook")) {
          // Update existing user to include facebook provider
          user.authProviders.push("facebook");
          user.socialProfile = {
            displayName,
            profilePicture,
            provider: "facebook",
          };
          await user.save();
        }

        done(null, user);
      } catch (error) {
        done(error, null);
      }
    },
  ),
);

// GitHub OAuth Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: config.oauth.github.clientId,
      clientSecret: config.oauth.github.clientSecret,
      callbackURL: config.oauth.github.callbackURL,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const { id, displayName, username, emails, photos } = profile;
        const email = emails?.[0]?.value;
        const profilePicture = photos?.[0]?.value;

        // Check if user exists by GitHub ID
        let user = await User.findOne({ githubId: id });

        if (!user) {
          // Check if email already exists
          user = await User.findOne({ email });

          if (user) {
            // Link GitHub ID to existing account
            user.githubId = id;
            if (!user.authProviders.includes("github")) {
              user.authProviders.push("github");
            }
            user.socialProfile = {
              displayName: displayName || username,
              profilePicture,
              provider: "github",
            };
            await user.save();
          } else {
            // Create new user
            user = new User({
              email: email || `gh_${id}@purrfectcare.local`,
              githubId: id,
              name: displayName || username || "GitHub User",
              profileImage: profilePicture,
              authProviders: ["github"],
              isVerified: email ? true : false,
              socialProfile: {
                displayName: displayName || username,
                profilePicture,
                provider: "github",
              },
            });
            await user.save();
          }
        } else if (user && !user.authProviders.includes("github")) {
          // Update existing user to include github provider
          user.authProviders.push("github");
          user.socialProfile = {
            displayName: displayName || username,
            profilePicture,
            provider: "github",
          };
          await user.save();
        }

        done(null, user);
      } catch (error) {
        done(error, null);
      }
    },
  ),
);

// Serialize user for session management (only used for Passport internal session, not for JWT)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session (only used for Passport internal session, not for JWT)
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
