export const Footer = () => {
  return (
    <footer className="w-full bg-white/95 backdrop-blur-sm border-t border-gray-200 px-4 py-8 md:px-6 mt-16">
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-gradient-to-r from-furry-cyan via-furry-orange to-furry-lime rounded-2xl p-6 md:p-8 shadow-lg">
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 drop-shadow-lg">
            Hey Furry Lovers! 
          </h3>
          <p className="text-lg md:text-xl text-white/95 leading-relaxed drop-shadow-md">
            Our site is still wagging its tail in progress 🐶🐱<br />
            But don&apos;t worry – very soon your furry friend will be jumping with joy 🐇🐦🐢<br />
            We&apos;re super excited to serve and pamper your furry buddy. Stay tuned!
          </p>
          
          {/* Animated paw prints */}
          <div className="flex justify-center items-center space-x-4 mt-6">
            {["🐾", "🐾", "🐾"].map((paw, index) => (
              <span 
                key={index}
                className="text-2xl animate-bounce"
                style={{
                  animationDelay: `${index * 0.2}s`,
                  animationDuration: "1.5s"
                }}
              >
                {paw}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};