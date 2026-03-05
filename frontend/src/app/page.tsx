"use client";

import { useState, useEffect } from "react";
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
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Scissors,
  GraduationCap,
  Home,
  Stethoscope,
  Plus,
  Star,
  Loader2,
} from "lucide-react";
import { adoptionListingApi } from "@/lib/api/adoption";
import type { AdoptionListing } from "@/lib/api/adoption";
import { productApi } from "@/lib/api/product";
import type { Product } from "@/lib/api/product";
import { lostFoundApi } from "@/lib/api/lostFound";
import type { LostFoundPost } from "@/lib/api/lostFound";
import { serviceProviderApi } from "@/lib/api/service";
import type { ServiceProvider } from "@/lib/api/service";

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

// Service type config for icons
const SERVICE_TYPE_CONFIG: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    color: string;
    iconColor: string;
  }
> = {
  veterinary: {
    icon: Stethoscope,
    label: "Veterinary Care",
    color: "bg-pink-100",
    iconColor: "text-pink-500",
  },
  grooming: {
    icon: Scissors,
    label: "Pet Grooming",
    color: "bg-orange-100",
    iconColor: "text-orange-500",
  },
  training: {
    icon: GraduationCap,
    label: "Training",
    color: "bg-purple-100",
    iconColor: "text-purple-500",
  },
  pet_sitting: {
    icon: Home,
    label: "Pet Sitting",
    color: "bg-green-100",
    iconColor: "text-green-500",
  },
  pet_adoption: {
    icon: Heart,
    label: "Pet Adoption",
    color: "bg-red-100",
    iconColor: "text-red-500",
  },
  marketplace: {
    icon: ShoppingBag,
    label: "Marketplace",
    color: "bg-blue-100",
    iconColor: "text-blue-500",
  },
  other: {
    icon: PawPrint,
    label: "Other Services",
    color: "bg-gray-100",
    iconColor: "text-gray-500",
  },
};

function formatAge(months: number) {
  if (months < 1) return "< 1 mo";
  if (months < 12) return `${months} mo`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return `${years} yr${years > 1 ? "s" : ""}`;
  return `${years}yr ${rem}mo`;
}

function timeAgo(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Real data state
  const [adoptionListings, setAdoptionListings] = useState<AdoptionListing[]>(
    [],
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [lostFoundPosts, setLostFoundPosts] = useState<LostFoundPost[]>([]);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    adoptions: 0,
    providers: 0,
    products: 0,
    lostFound: 0,
  });

  // Fetch real data from APIs
  useEffect(() => {
    async function fetchLandingData() {
      setIsLoading(true);
      const [adoptionRes, productRes, lostFoundRes, providerRes] =
        await Promise.all([
          adoptionListingApi.getListings({ limit: 3 }),
          productApi.getProducts({ limit: 4 }),
          lostFoundApi.getPosts({ limit: 2 }),
          serviceProviderApi.getProviders({ limit: 4 }),
        ]);

      if (adoptionRes.data) {
        setAdoptionListings(adoptionRes.data.listings);
        setStats((s) => ({
          ...s,
          adoptions: adoptionRes.data!.pagination.total,
        }));
      }
      if (productRes.data) {
        setProducts(productRes.data.products);
        setStats((s) => ({
          ...s,
          products: productRes.data!.pagination.total,
        }));
      }
      if (lostFoundRes.data) {
        setLostFoundPosts(lostFoundRes.data.posts);
        setStats((s) => ({
          ...s,
          lostFound: lostFoundRes.data!.pagination.total,
        }));
      }
      if (providerRes.data) {
        setProviders(providerRes.data.providers);
        setStats((s) => ({
          ...s,
          providers: providerRes.data!.pagination.total,
        }));
      }

      setIsLoading(false);
    }
    fetchLandingData();
  }, []);

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
              <div className="w-8 h-8 bg-linear-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
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
                href="/adopt"
                className="text-gray-600 hover:text-pink-500 transition-colors"
              >
                Adoption
              </Link>
              <Link
                href="/services"
                className="text-gray-600 hover:text-pink-500 transition-colors"
              >
                Services
              </Link>
              <Link
                href="/marketplace"
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
                className="bg-linear-to-r from-pink-500 to-rose-500 text-white px-5 py-2.5 rounded-full font-medium hover:shadow-lg hover:shadow-pink-500/30 transition-all"
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
              <Link href="/adopt" className="text-gray-600 py-2">
                Adoption
              </Link>
              <Link href="/services" className="text-gray-600 py-2">
                Services
              </Link>
              <Link href="/marketplace" className="text-gray-600 py-2">
                Marketplace
              </Link>
              <hr className="border-gray-100" />
              <Link href="/login" className="text-gray-600 py-2">
                Sign In
              </Link>
              <Link
                href="/register"
                className="bg-linear-to-r from-pink-500 to-rose-500 text-white px-5 py-3 rounded-full font-medium text-center"
              >
                Get Started
              </Link>
            </nav>
          </motion.div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-b from-pink-50/50 to-white">
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
              <span className="text-transparent bg-clip-text bg-linear-to-r from-pink-500 to-rose-500">
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
              <Image
                src="https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=600&h=400&fit=crop"
                alt="Happy pets"
                fill
                sizes="(max-width: 768px) 100vw, 448px"
                className="object-cover"
                priority
              />
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href="/adopt"
                className="bg-linear-to-r from-pink-500 to-rose-500 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl hover:shadow-pink-500/30 transition-all"
              >
                Explore Adoptable Pets
              </Link>
              <Link
                href="/marketplace"
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
              Managing pet care shouldn&apos;t be complicated, but often it is.
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
      <section className="py-16 md:py-24 bg-linear-to-b from-pink-50/50 to-white">
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
              Everything you need for your pet&apos;s wellbeing, unified in one
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
              href="/adopt"
              className="text-pink-500 font-medium flex items-center gap-1 hover:gap-2 transition-all"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
            </div>
          ) : adoptionListings.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-12 h-12 text-pink-300 mx-auto mb-3" />
              <p className="text-gray-500">
                No pets available for adoption yet.
              </p>
              <Link
                href="/adopt"
                className="text-pink-500 font-medium mt-2 inline-block"
              >
                Check back soon →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adoptionListings.map((listing, index) => (
                <motion.div
                  key={listing._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={`/adopt/${listing._id}`}
                    className="block bg-white rounded-3xl overflow-hidden shadow-lg shadow-gray-100 hover:shadow-xl transition-shadow"
                  >
                    <div className="relative h-48 md:h-56">
                      {listing.photos?.[0] ? (
                        <Image
                          src={listing.photos[0]}
                          alt={listing.name}
                          fill
                          sizes="(max-width: 1024px) 100vw, 33vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-pink-50 flex items-center justify-center">
                          <PawPrint className="w-12 h-12 text-pink-200" />
                        </div>
                      )}
                      <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-semibold px-2.5 py-1 rounded-full capitalize text-gray-700">
                        {listing.species}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg text-gray-900">
                        {listing.name}
                      </h3>
                      <div className="flex items-center gap-3 text-gray-500 text-sm mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />{" "}
                          {formatAge(listing.age)}
                        </span>
                        {listing.breed && (
                          <span className="text-gray-400">{listing.breed}</span>
                        )}
                      </div>
                      {listing.location && (
                        <p className="flex items-center gap-1 text-gray-400 text-sm mt-1">
                          <MapPin className="w-3.5 h-3.5" /> {listing.location}
                        </p>
                      )}
                      {listing.adoptionFee != null && (
                        <p className="text-pink-500 font-semibold text-sm mt-2">
                          {listing.adoptionFee === 0
                            ? "Free Adoption"
                            : `NPR ${listing.adoptionFee}`}
                        </p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
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

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
            </div>
          ) : providers.length === 0 ? (
            <div className="text-center py-12">
              <Stethoscope className="w-12 h-12 text-pink-300 mx-auto mb-3" />
              <p className="text-gray-500">No service providers yet.</p>
              <Link
                href="/services"
                className="text-pink-500 font-medium mt-2 inline-block"
              >
                Check back soon →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {providers.map((provider, index) => {
                const config =
                  SERVICE_TYPE_CONFIG[provider.serviceType] ||
                  SERVICE_TYPE_CONFIG.other;
                const Icon = config.icon;
                return (
                  <motion.div
                    key={provider._id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      href={`/services/${provider._id}`}
                      className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      {provider.image ? (
                        <Image
                          src={provider.image}
                          alt={provider.name}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                      ) : (
                        <div className={`${config.color} p-3 rounded-xl`}>
                          <Icon className={`w-6 h-6 ${config.iconColor}`} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {provider.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 text-sm capitalize">
                            {config.label}
                          </span>
                          {provider.rating > 0 && (
                            <span className="flex items-center gap-0.5 text-amber-500 text-sm">
                              <Star className="w-3.5 h-3.5 fill-current" />
                              {provider.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-pink-500 font-medium text-sm shrink-0">
                        Book Now →
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
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

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-12 h-12 text-pink-300 mx-auto mb-3" />
              <p className="text-gray-500">No products listed yet.</p>
              <Link
                href="/marketplace"
                className="text-pink-500 font-medium mt-2 inline-block"
              >
                Check back soon →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {products.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={`/marketplace/${product._id}`}
                    className="block bg-white rounded-2xl p-3 shadow-sm hover:shadow-lg transition-shadow border border-gray-100"
                  >
                    <div className="relative">
                      {product.images?.[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          width={240}
                          height={160}
                          sizes="(max-width: 768px) 50vw, 25vw"
                          className="w-full h-32 object-cover rounded-xl mb-3"
                        />
                      ) : (
                        <div className="w-full h-32 bg-pink-50 rounded-xl mb-3 flex items-center justify-center">
                          <ShoppingBag className="w-8 h-8 text-pink-200" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      {product.name}
                    </h3>
                    <p className="text-gray-500 text-xs capitalize">
                      {product.category}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-pink-500 font-bold">
                        NPR {product.price.toFixed(2)}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
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
              href="/lost-and-found"
              className="text-pink-500 font-medium flex items-center gap-1 hover:gap-2 transition-all"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
            </div>
          ) : lostFoundPosts.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-pink-300 mx-auto mb-3" />
              <p className="text-gray-500">No lost or found posts yet.</p>
            </div>
          ) : (
            <div className="space-y-4 mb-8">
              {lostFoundPosts.map((post, index) => (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={`/lost-and-found/${post._id}`}
                    className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {post.photos?.[0] ? (
                      <Image
                        src={post.photos[0]}
                        alt={post.title}
                        width={64}
                        height={64}
                        sizes="64px"
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-pink-50 flex items-center justify-center shrink-0">
                        <PawPrint className="w-6 h-6 text-pink-200" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            post.postType === "lost"
                              ? "bg-red-100 text-red-600"
                              : "bg-green-100 text-green-600"
                          }`}
                        >
                          {post.postType.toUpperCase()}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {timeAgo(post.createdAt)}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 truncate">
                        {post.title}
                      </h3>
                      <p className="text-gray-500 text-sm flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" />{" "}
                        <span className="truncate">{post.locationAddress}</span>
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

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
            <Link
              href="/lost-and-found/create"
              className="inline-block bg-linear-to-r from-pink-500 to-rose-500 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg hover:shadow-pink-500/30 transition-all"
            >
              Post Lost/Found Pet
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-linear-to-br from-pink-500 to-rose-600">
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
                  {stats.adoptions}+
                </p>
                <p className="text-pink-100 text-sm">Adoptable Pets</p>
              </div>
              <div>
                <p className="text-3xl md:text-4xl font-bold text-white">
                  {stats.products}+
                </p>
                <p className="text-pink-100 text-sm">Products Listed</p>
              </div>
              <div>
                <p className="text-3xl md:text-4xl font-bold text-white">
                  {stats.providers}+
                </p>
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
              <div className="w-8 h-8 bg-linear-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                <PawPrint className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">PurrfectCare</span>
            </Link>
            <p className="text-gray-400">
              Your pet&apos;s happiness, our priority
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    href="/adopt"
                    className="hover:text-pink-400 transition-colors"
                  >
                    Adoption
                  </Link>
                </li>
                <li>
                  <Link
                    href="/services"
                    className="hover:text-pink-400 transition-colors"
                  >
                    Pet Services
                  </Link>
                </li>
                <li>
                  <Link
                    href="/marketplace"
                    className="hover:text-pink-400 transition-colors"
                  >
                    Marketplace
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Community</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    href="/lost-and-found"
                    className="hover:text-pink-400 transition-colors"
                  >
                    Lost & Found
                  </Link>
                </li>
                <li>
                  <Link
                    href="/help-support"
                    className="hover:text-pink-400 transition-colors"
                  >
                    Help & Support
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Account</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    href="/login"
                    className="hover:text-pink-400 transition-colors"
                  >
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="hover:text-pink-400 transition-colors"
                  >
                    Create Account
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
            © {new Date().getFullYear()} PurrfectCare. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
