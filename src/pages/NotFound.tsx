import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Container from "../components/common/Container";
import { AiOutlineHome } from "react-icons/ai";

const NotFound = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="bg-Dark min-h-screen flex items-center justify-center">
      <Container className="py-10 md:py-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          <motion.div
            variants={itemVariants}
            className="relative mb-8 md:mb-12"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 0.6,
                type: "spring",
                bounce: 0.5,
              }}
              className="text-Red text-9xl md:text-[180px] font-bold opacity-10 select-none"
            >
              404
            </motion.div>
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-3xl md:text-5xl font-bold"
            >
              Page Not Found
            </motion.div>
          </motion.div>

          <motion.p
            variants={itemVariants}
            className="text-[#C6C6C8] text-sm md:text-lg mb-10 max-w-lg mx-auto"
          >
            The page you're looking for doesn't exist or has been moved. Let's
            get you back on track.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-wrap justify-center gap-6"
          >
            <Link
              to="/"
              className="bg-Red text-white px-6 py-3 rounded-md hover:bg-opacity-90 transition-all flex items-center gap-2 group"
            >
              <AiOutlineHome className="text-xl group-hover:scale-110 transition-transform" />
              <span>Back to Home</span>
            </Link>

            <Link
              to="/product"
              className="bg-[#292B30] text-white px-6 py-3 rounded-md hover:bg-[#33363b] transition-all group"
            >
              <span>Browse Products</span>
            </Link>
          </motion.div>
        </motion.div>
      </Container>
    </div>
  );
};

export default NotFound;
