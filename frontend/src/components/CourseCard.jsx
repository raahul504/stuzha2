import React from 'react';
import { formatIndianCurrency } from '../utils/currency';

const CourseCard = ({ course, categoryName, onClick, progress, buttonText }) => {
    const {
        title,
        thumbnailUrl,
        difficultyLevel,
        price,
        shortDescription,
        description,
        isPurchased,
        completed
    } = course;

    const displayPrice = parseFloat(price) === 0 ? 'Free' : `₹${formatIndianCurrency(price)}`;
    const isCompleted = completed || progress === 100;

    return (
        <div
            onClick={onClick}
            className="group relative bg-dcs-dark-gray rounded-2xl overflow-hidden border border-dcs-purple/10 cursor-pointer flex flex-col h-full transition-all duration-300 hover:-translate-y-2 hover:border-dcs-purple/50 hover:shadow-[0_20px_40px_rgba(157,80,187,0.2)]"
        >
            {/* Image / Banner */}
            <div className="h-40 sm:h-48 w-full relative overflow-hidden">
                {thumbnailUrl ? (
                    <img
                        src={thumbnailUrl}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-dcs-purple/40 to-dcs-black text-2xl font-bold text-white/50 text-center px-4">
                        {title}
                    </div>
                )}

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-dcs-dark-gray to-transparent opacity-60" />

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    {categoryName && (
                        <span className="px-3 py-1 text-xs font-semibold tracking-wide uppercase text-white bg-dcs-purple/80 backdrop-blur-md rounded-full shadow-lg">
                            {categoryName}
                        </span>
                    )}
                </div>

                {/* Status Badge */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 scale-90 origin-top-right">
                    {isCompleted ? (
                        <span className="px-3 py-1 text-xs font-bold uppercase text-white bg-green-500/80 backdrop-blur-md rounded-full shadow-lg border border-green-400/30">
                            ✓ Completed
                        </span>
                    ) : isPurchased ? (
                        <span className="px-3 py-1 text-xs font-bold uppercase text-white bg-blue-500/80 backdrop-blur-md rounded-full shadow-lg border border-blue-400/30">
                            Enrolled
                        </span>
                    ) : null}
                </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 flex flex-col flex-grow">
                <div className="flex items-center justify-between mb-3 text-xs font-medium text-dcs-text-gray">
                    <div className="flex items-center gap-2">
                        {difficultyLevel && (
                            <span className={`px-2 py-0.5 rounded border ${difficultyLevel === 'BEGINNER' ? 'border-green-500/30 text-green-400' :
                                difficultyLevel === 'INTERMEDIATE' ? 'border-yellow-500/30 text-yellow-400' :
                                    'border-red-500/30 text-red-400'
                                }`}>
                                {difficultyLevel}
                            </span>
                        )}
                    </div>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 leading-tight group-hover:text-dcs-purple transition-colors line-clamp-2">
                    {title}
                </h3>

                <p className="text-dcs-text-gray text-sm line-clamp-2 mb-6 flex-grow">
                    {shortDescription || description}
                </p>

                {/* Footer Content: Progress or Price */}
                <div className="mt-auto">
                    {progress !== undefined ? (
                        <div className="pt-4 border-t border-white/5">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-xs font-semibold text-dcs-text-gray uppercase tracking-wider">Course Progress</span>
                                <span className="text-sm font-bold text-white">{Math.round(progress)}%</span>
                            </div>
                            <div className="w-full bg-dcs-black/50 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-dcs-purple to-dcs-electric-indigo h-full rounded-full transition-all duration-1000"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-2">
                            <span className="text-lg sm:text-xl font-bold text-white group-hover:text-dcs-electric-indigo transition-colors uppercase">
                                {displayPrice}
                            </span>
                            <button className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-white/5 border border-white/10 rounded-lg group-hover:bg-dcs-purple group-hover:border-dcs-purple transition-all whitespace-nowrap">
                                {buttonText || 'View Details'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CourseCard;
