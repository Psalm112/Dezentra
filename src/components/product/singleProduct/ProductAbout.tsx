import { MdVerified } from "react-icons/md";
import { FaStore } from "react-icons/fa";
import { BiLinkExternal } from "react-icons/bi";
import { Product } from "../../../utils/types";
import { useNavigate } from "react-router";

const ProductAbout = ({ product }: { product: Product }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="w-full">
        <h2 className="text-base sm:text-xl text-white font-medium">
          {product.name}
        </h2>
        {/* <span className="text-base sm:text-xl text-white font-medium">
          {product.price}
        </span> */}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <FaStore className="text-gray-400 h-3.5 w-3.5" />
          <span className="text-xs sm:text-sm text-white/70">
            By{" "}
            {/* <a
              href={`/vendor/${product.seller}`}
              className="hover:text-Red transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            > */}
            {typeof product.seller === "object"
              ? product.seller.name
              : product.seller}{" "}
            <BiLinkExternal className="inline h-3 w-3" />
            {/* </a> */}
          </span>
          {/* {product.verified && ( */}
          <MdVerified className="text-blue-500 h-4 w-4 sm:h-5 sm:w-5" />
          {/* )} */}
        </div>

        <div className="flex items-center gap-4">
          <div className="text-xs sm:text-sm text-white/70">
            <span className="text-white">22</span> sold
          </div>

          <div className="text-xs sm:text-sm">
            <span
              className={
                product.stock && product.stock !== 0
                  ? "text-green-500"
                  : "text-Red"
              }
            >
              {`"${product.stock} In Stock"`}
            </span>
          </div>
        </div>
      </div>

      <div className="pt-1">
        <span
          className="text-xs sm:text-sm bg-[#1a1b1f] text-gray-400 px-2 py-1 rounded"
          onClick={() => navigate(`/product/category/${product.category}`)}
        >
          {product.category}
        </span>
      </div>
    </div>
  );
};

export default ProductAbout;
