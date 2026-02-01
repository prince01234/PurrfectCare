"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Menu,
  X,
  PawPrint,
  Heart,
  Users,
  Calendar,
  ShoppingBag,
  AlertTriangle,
  Bell,
  Search,
  MapPin,
  ChevronRight,
  Star,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Scissors,
  GraduationCap,
  Home,
  Stethoscope,
  Plus,
} from "lucide-react";

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sample data for adoptable pets
  const adoptablePets = [
    {
      id: 1,
      name: "Whiskers",
      age: "8 months",
      location: "San Francisco, CA",
      image:
        "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=300&fit=crop",
      type: "cat",
    },
    {
      id: 2,
      name: "Max",
      age: "3 years",
      location: "Los Angeles, CA",
      image:
        "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop",
      type: "dog",
    },
    {
      id: 3,
      name: "Cotton",
      age: "1 year",
      location: "Seattle, WA",
      image:
        "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400&h=300&fit=crop",
      type: "rabbit",
    },
  ];

  // Sample data for services
  const services = [
    {
      icon: Stethoscope,
      title: "Veterinary Care",
      description: "Professional health checkups and treatments",
      color: "bg-pink-100",
      iconColor: "text-pink-500",
    },
    {
      icon: Scissors,
      title: "Pet Grooming",
      description: "Keep your pet looking and feeling great",
      color: "bg-orange-100",
      iconColor: "text-orange-500",
    },
    {
      icon: GraduationCap,
      title: "Training Classes",
      description: "Professional obedience and behavior training",
      color: "bg-purple-100",
      iconColor: "text-purple-500",
    },
    {
      icon: Home,
      title: "Pet Sitting",
      description: "Trusted care when you're away from home",
      color: "bg-green-100",
      iconColor: "text-green-500",
    },
  ];

  // Sample data for marketplace
  const marketplaceItems = [
    {
      id: 1,
      name: "Premium Dog Food",
      description: "5kg bag",
      price: 29.99,
      image:
        "https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=200&h=200&fit=crop",
      premium: true,
    },
    {
      id: 2,
      name: "Cat Toy Bundle",
      description: "6 piece set",
      price: 19.99,
      image:
        "https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=200&h=200&fit=crop",
      premium: false,
    },
    {
      id: 3,
      name: "Cozy Pet Bed",
      description: "Medium",
      price: 39.99,
      image:
        "https://images.unsplash.com/photo-1591946614720-90a587da4a36?w=200&h=200&fit=crop",
      premium: false,
    },
    {
      id: 4,
      name: "Collar & Leash Set",
      description: "Adjustable",
      price: 24.99,
      image:
        "https://images.unsplash.com/photo-1567612529009-afe25813a308?w=200&h=200&fit=crop",
      premium: false,
    },
  ];

  // Sample data for lost & found
  const lostFoundPets = [
    {
      id: 1,
      type: "LOST",
      name: "Brown Labrador",
      time: "2 hours ago",
      location: "Near Central Park, NYC",
      image:
        "https://images.unsplash.com/photo-1579213838058-8f4dd0e38e47?w=100&h=100&fit=crop",
    },
    {
      id: 2,
      type: "FOUND",
      name: "Gray Tabby Cat",
      time: "5 hours ago",
      location: "Downtown Portland, OR",
      image:
        "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=100&h=100&fit=crop",
    },
  ];

  // Features/challenges data
  const challenges = [
    {
      icon: AlertTriangle,
      title: "Fragmented Services",
      description: "Pet care is scattered across multiple apps and services",
      color: "bg-red-50",
      iconBg: "bg-red-100",
      iconColor: "text-red-500",
    },
    {
      icon: Bell,
      title: "Missed Care Tasks",
      description: "Important health and care reminders often get overlooked",
      color: "bg-yellow-50",
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
    {
      icon: Search,
      title: "Adoption Challenges",
      description: "Shelters struggle with transparency and record management",
      color: "bg-orange-50",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-500",
    },
    {
      icon: MapPin,
      title: "Lost Pet Recovery",
      description: "Finding lost pets is difficult without a unified system",
      color: "bg-purple-50",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-500",
    },
  ];

  // Solution features
  const solutionFeatures = [
    {
      icon: PawPrint,
      title: "Pet Profiles",
      description: "Centralized health tracking",
      color: "bg-pink-50",
      iconColor: "text-pink-500",
    },
    {
      icon: Heart,
      title: "Adoption",
      description: "Transparent listings",
      color: "bg-red-50",
      iconColor: "text-red-500",
    },
    {
      icon: Users,
      title: "Community",
      description: "Lost & found support",
      color: "bg-blue-50",
      iconColor: "text-blue-500",
    },
    {
      icon: Calendar,
      title: "Services",
      description: "Easy booking",
      color: "bg-green-50",
      iconColor: "text-green-500",
    },
    {
      icon: ShoppingBag,
      title: "Marketplace",
      description: "Pet essentials in one place",
      color: "bg-purple-50",
      iconColor: "text-purple-500",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                <PawPrint className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">
                PurrfectCare
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <Link
                href="#features"
                className="text-gray-600 hover:text-pink-500 transition-colors"
              >
                Features
              </Link>
              <Link
                href="#adoption"
                className="text-gray-600 hover:text-pink-500 transition-colors"
              >
                Adoption
              </Link>
              <Link
                href="#services"
                className="text-gray-600 hover:text-pink-500 transition-colors"
              >
                Services
              </Link>
              <Link
                href="#marketplace"
                className="text-gray-600 hover:text-pink-500 transition-colors"
              >
                Marketplace
              </Link>
            </nav>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/login"
                className="text-gray-600 hover:text-pink-500 transition-colors font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-5 py-2.5 rounded-full font-medium hover:shadow-lg hover:shadow-pink-500/30 transition-all"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-white border-t border-gray-100 px-4 py-4"
          >
            <nav className="flex flex-col gap-4">
              <Link href="#features" className="text-gray-600 py-2">
                Features
              </Link>
              <Link href="#adoption" className="text-gray-600 py-2">
                Adoption
              </Link>
              <Link href="#services" className="text-gray-600 py-2">
                Services
              </Link>
              <Link href="#marketplace" className="text-gray-600 py-2">
                Marketplace
              </Link>
              <hr className="border-gray-100" />
              <Link href="/login" className="text-gray-600 py-2">
                Sign In
              </Link>
              <Link
                href="/register"
                className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-5 py-3 rounded-full font-medium text-center"
              >
                Get Started
              </Link>
            </nav>
          </motion.div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-pink-50/50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <motion.div
            initial="initial"
            animate="animate"
            variants={staggerContainer}
            className="text-center"
          >
            <motion.h1
              variants={fadeInUp}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4"
            >
              All-in-One Pet Care &
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">
                {" "}
                Adoption Platform
              </span>
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto mb-8"
            >
              Everything your furry friend needs, all in one place
            </motion.p>

            {/* Hero Image */}
            <motion.div
              variants={fadeInUp}
              className="relative w-full max-w-md mx-auto mb-8 rounded-3xl overflow-hidden shadow-2xl shadow-pink-500/20"
            >
              <img
                src="https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=600&h=400&fit=crop"
                alt="Happy pets"
                className="w-full h-64 md:h-80 object-cover"
              />
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href="#adoption"
                className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl hover:shadow-pink-500/30 transition-all"
              >
                Explore Adoptable Pets
              </Link>
              <Link
                href="#marketplace"
                className="border-2 border-pink-500 text-pink-500 px-8 py-4 rounded-full font-semibold text-lg hover:bg-pink-50 transition-all"
              >
                Browse Marketplace
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Challenges Section */}
      <section id="features" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              The Challenge Pet Owners Face
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Managing pet care shouldn't be complicated, but often it is.
            </p>
          </motion.div>

          <div className="space-y-4">
            {challenges.map((challenge, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`${challenge.color} rounded-2xl p-4 flex items-start gap-4`}
              >
                <div className={`${challenge.iconBg} p-3 rounded-xl`}>
                  <challenge.icon
                    className={`w-6 h-6 ${challenge.iconColor}`}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {challenge.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {challenge.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-pink-50/50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Your Complete Pet Care Solution
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything you need for your pet's wellbeing, unified in one
              platform
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {solutionFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-4"
              >
                <div
                  className={`${feature.color} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3`}
                >
                  <feature.icon className={`w-8 h-8 ${feature.iconColor}`} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {feature.title}
                </h3>
                <p className="text-gray-500 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Adoptable Pets Section */}
      <section id="adoption" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Adoptable Pets
            </h2>
            <Link
              href="/adoption"
              className="text-pink-500 font-medium flex items-center gap-1 hover:gap-2 transition-all"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adoptablePets.map((pet, index) => (
              <motion.div
                key={pet.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-3xl overflow-hidden shadow-lg shadow-gray-100 hover:shadow-xl transition-shadow"
              >
                <div className="relative h-48 md:h-56">
                  <img
                    src={pet.image}
                    alt={pet.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-900">
                    {pet.name}
                  </h3>
                  <div className="flex items-center gap-3 text-gray-500 text-sm mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> {pet.age}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> {pet.location}
                    </span>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button className="flex-1 border-2 border-gray-200 text-gray-700 py-2.5 rounded-xl font-medium hover:border-pink-500 hover:text-pink-500 transition-all">
                      View Details
                    </button>
                    <button className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white py-2.5 rounded-xl font-medium hover:shadow-lg hover:shadow-pink-500/30 transition-all">
                      Apply to Adopt
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Pet Services
            </h2>
            <Link
              href="/services"
              className="text-pink-500 font-medium flex items-center gap-1 hover:gap-2 transition-all"
            >
              See All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`${service.color} p-3 rounded-xl`}>
                  <service.icon className={`w-6 h-6 ${service.iconColor}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {service.title}
                  </h3>
                  <p className="text-gray-500 text-sm">{service.description}</p>
                </div>
                <Link
                  href="/services"
                  className="text-pink-500 font-medium text-sm"
                >
                  Book Now →
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Marketplace Section */}
      <section id="marketplace" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Pet Marketplace
            </h2>
            <Link
              href="/marketplace"
              className="text-pink-500 font-medium flex items-center gap-1 hover:gap-2 transition-all"
            >
              Shop All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {marketplaceItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-3 shadow-sm hover:shadow-lg transition-shadow border border-gray-100"
              >
                <div className="relative">
                  {item.premium && (
                    <span className="absolute top-2 left-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      PREMIUM
                    </span>
                  )}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-32 object-cover rounded-xl mb-3"
                  />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">
                  {item.name}
                </h3>
                <p className="text-gray-500 text-xs">{item.description}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-pink-500 font-bold">${item.price}</span>
                  <button className="w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center hover:bg-pink-600 transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Lost & Found Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Lost & Found
            </h2>
            <Link
              href="/lost-found"
              className="text-pink-500 font-medium flex items-center gap-1 hover:gap-2 transition-all"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-4 mb-8">
            {lostFoundPets.map((pet, index) => (
              <motion.div
                key={pet.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm"
              >
                <img
                  src={pet.image}
                  alt={pet.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        pet.type === "LOST"
                          ? "bg-red-100 text-red-600"
                          : "bg-green-100 text-green-600"
                      }`}
                    >
                      {pet.type}
                    </span>
                    <span className="text-gray-400 text-xs">{pet.time}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">{pet.name}</h3>
                  <p className="text-gray-500 text-sm flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {pet.location}
                  </p>
                </div>
                <button className="border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:border-pink-500 hover:text-pink-500 transition-all">
                  View Details
                </button>
              </motion.div>
            ))}
          </div>

          {/* Help Reunite Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl p-6 text-center shadow-sm"
          >
            <h3 className="font-bold text-xl text-gray-900 mb-2">
              Help Reunite Pets with Their Families
            </h3>
            <p className="text-gray-500 mb-4">
              Post about lost or found pets in your community
            </p>
            <button className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg hover:shadow-pink-500/30 transition-all">
              Post Lost/Found Pet
            </button>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-pink-500 to-rose-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Join the PurrfectCare Community
            </h2>
            <p className="text-pink-100 max-w-2xl mx-auto mb-8">
              Create your free account and give your pets the care they deserve
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="bg-white text-pink-500 px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl transition-all"
              >
                Create Free Account
              </Link>
              <Link
                href="#features"
                className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/10 transition-all"
              >
                Learn More About Us
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-12 max-w-xl mx-auto">
              <div>
                <p className="text-3xl md:text-4xl font-bold text-white">
                  500+
                </p>
                <p className="text-pink-100 text-sm">Pets Adopted</p>
              </div>
              <div>
                <p className="text-3xl md:text-4xl font-bold text-white">
                  1,200+
                </p>
                <p className="text-pink-100 text-sm">Active Users</p>
              </div>
              <div>
                <p className="text-3xl md:text-4xl font-bold text-white">50+</p>
                <p className="text-pink-100 text-sm">Service Partners</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Logo & Description */}
          <div className="text-center mb-10">
            <Link href="/" className="inline-flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                <PawPrint className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">PurrfectCare</span>
            </Link>
            <p className="text-gray-400">Your pet's happiness, our priority</p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <h4 className="font-semibold mb-4">About</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    href="/about"
                    className="hover:text-pink-400 transition-colors"
                  >
                    Our Story
                  </Link>
                </li>
                <li>
                  <Link
                    href="/how-it-works"
                    className="hover:text-pink-400 transition-colors"
                  >
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link
                    href="/careers"
                    className="hover:text-pink-400 transition-colors"
                  >
                    Careers
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    href="/help"
                    className="hover:text-pink-400 transition-colors"
                  >
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-pink-400 transition-colors"
                  >
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faq"
                    className="hover:text-pink-400 transition-colors"
                  >
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-pink-400 transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="hover:text-pink-400 transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="/cookies"
                    className="hover:text-pink-400 transition-colors"
                  >
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="text-gray-400 hover:text-pink-400 transition-colors"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-pink-400 transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-pink-400 transition-colors"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-pink-400 transition-colors"
                >
                  <Youtube className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            © 2024 PurrfectCare. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
