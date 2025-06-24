import { motion } from "framer-motion";
import Container from "../components/common/Container";
import Button from "../components/common/Button";
import { FormEvent, useState } from "react";
import {
  FaFacebookF,
  FaTwitter,
  // FaSnapchatGhost,
  FaInstagram,
  FaLinkedinIn,
  // FaGithub,
  FaTelegram,
} from "react-icons/fa";
import { BsPeople } from "react-icons/bs";
import { AiOutlineCalendar, AiOutlineMail } from "react-icons/ai";
import { Rocket } from ".";

const Community = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  const handleSubscribe = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (email.trim()) {
      console.log("Subscribing email:", email);
      setSubscribed(true);
      setEmail("");

      setTimeout(() => {
        setSubscribed(false);
      }, 5000);
    }
  };

  const handleTelegramJoin = () => {
    window.open("https://t.me/dezenmart_commuinity", "_blank");
  };

  // Features kept from original code
  const features = [
    {
      icon: <BsPeople className="text-3xl text-Red" />,
      title: "Connect with Traders",
      description:
        "Meet and interact with other DezenMart enthusiasts and traders.",
    },
    {
      icon: <AiOutlineCalendar className="text-3xl text-Red" />,
      title: "Exclusive Events",
      description:
        "Get access to community events, trading competitions, and more.",
    },
    {
      icon: (
        <svg
          className="w-8 h-8 text-Red"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 15C15.866 15 19 11.866 19 8C19 4.13401 15.866 1 12 1C8.13401 1 5 4.13401 5 8C5 11.866 8.13401 15 12 15Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8.21 13.89L7 23L12 20L17 23L15.79 13.88"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      title: "Earn Rewards",
      description:
        "Participate in discussions and activities to earn exclusive rewards.",
    },
  ];

  return (
    <div className="bg-Dark min-h-screen flex flex-col">
      <Container className="py-10 md:py-16 flex-grow flex flex-col items-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center w-full max-w-4xl mx-auto"
        >
          <motion.div
            variants={itemVariants}
            className="text-center mb-8 w-full"
          >
            <div className="flex flex-col md:flex-row justify-between items-center mb-10">
              <div className="flex-1 mb-8 md:mb-0">
                <h1 className="md:text-left text-4xl md:text-6xl font-bold text-white mb-4">
                  All Good Things
                  <br />
                  Come to Those
                  <br />
                  who Wait...
                </h1>
              </div>
              <div className="hidden md:block">
                <div className="relative w-64 h-64">
                  <div className="bg-[#1E3A56] rounded-full w-full h-full flex items-center justify-center">
                    <div className="rocket-icon">
                      <img
                        src={Rocket}
                        alt="Rocket"
                        className="w-60 h-60 ml-6 mb-6"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <motion.div variants={itemVariants} className="mt-8">
              <p className="text-[#C6C6C8] text-lg mb-6">
                Get notified when it launch
              </p>

              <form onSubmit={handleSubscribe} className="w-full mb-6">
                <div className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                  <div className="relative flex-1">
                    <AiOutlineMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#545456]" />
                    <input
                      type="email"
                      placeholder="Your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#212428] text-white py-3 pl-10 pr-3 rounded-md focus:outline-none focus:ring-1 focus:ring-Red"
                      required
                    />
                  </div>
                  <Button
                    title="Subscribe"
                    className="flex items-center justify-center bg-Red text-white px-6 py-3 rounded-md hover:bg-opacity-90 transition-all"
                    type="submit"
                  />
                </div>
              </form>

              <motion.div
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="inline-block mb-10"
              >
                <button
                  onClick={handleTelegramJoin}
                  className="bg-[#26A5E4] text-white px-6 py-3 rounded-md hover:bg-opacity-90 transition-all flex items-center gap-2 mx-auto"
                >
                  <FaTelegram className="text-xl" />
                  <span>Join Our Telegram Community</span>
                </button>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* What to Expect Section */}
          <motion.div variants={itemVariants} className="w-full mb-12">
            <motion.h3
              variants={itemVariants}
              className="text-xl md:text-2xl font-semibold text-white mb-8 text-center"
            >
              What to expect
            </motion.h3>

            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mx-auto"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                  className="bg-[#292B30] p-6 rounded-lg hover:shadow-lg transition-all"
                >
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-[#C6C6C8] text-sm">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Launch Estimate */}
          <motion.div
            variants={itemVariants}
            className="mb-12 px-6 py-5 bg-[#292B30] rounded-lg inline-flex items-center"
          >
            <span className="w-3 h-3 bg-Red rounded-full animate-pulse mr-3"></span>
            <p className="text-white text-sm">
              Estimated launch: <span className="font-semibold">Q3 2025</span>
            </p>
          </motion.div>

          {/* Footer */}
          <motion.div variants={itemVariants} className="mt-auto w-full">
            <div className="flex justify-center space-x-6 mb-6">
              <SocialIcon icon={<FaFacebookF />} />
              <SocialIcon icon={<FaTwitter />} />
              {/* <SocialIcon icon={<FaSnapchatGhost />} /> */}
              <SocialIcon icon={<FaInstagram />} />
              <SocialIcon icon={<FaLinkedinIn />} />
              {/* <SocialIcon icon={<FaGithub />} /> */}
            </div>
            <p className="text-[#C6C6C8] text-sm text-center">
              © Copyrights Dezenmart| All Rights Reserved
            </p>
          </motion.div>
        </motion.div>
      </Container>
    </div>
  );
};

const SocialIcon = ({ icon }: { icon: React.ReactNode }) => {
  return (
    <motion.a
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="w-8 h-8 flex items-center justify-center text-white hover:text-Red transition-colors"
      href="#"
    >
      {icon}
    </motion.a>
  );
};

export default Community;
