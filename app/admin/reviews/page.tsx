"use client";

import { useState } from 'react';
import { CheckCircle, XCircle, Star, MessageSquare, TrendingUp, User, Mail, Trash2 } from 'lucide-react';

type Review = {
  id: string;
  name: string;
  email: string;
  rating: number;
  date: string;
  content: string;
  category: string;
  helpful: number;
  notHelpful: number;
  status: 'pending' | 'approved' | 'rejected';
};

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([
    {
      id: '1',
      name: 'Sarah Mitchell',
      email: 'sarah@acmeproperties.com',
      rating: 5,
      date: '1/10/2024',
      content: "We've been using Hostify for over 2 years now and it has completely transformed our operations. The channel management is seamless, guest communication is automated, and the pricing tools help us stay competitive. The customer support is also top-notch.",
      category: 'Property Management',
      helpful: 24,
      notHelpful: 2,
      status: 'pending'
    },
    {
      id: '2',
      name: 'Mike Rodriguez',
      email: 'mike@coastal-rentals.com',
      rating: 4,
      date: '1/8/2024',
      content: 'Beyond Pricing has definitely helped increase our revenue with smart pricing adjustments. The market data is comprehensive and the automation saves tons of time. However, I wish there were more customization options for specific property types.',
      category: 'Pricing Tools',
      helpful: 18,
      notHelpful: 1,
      status: 'pending'
    },
    {
      id: '3',
      name: 'Jennifer Lee',
      email: 'jennifer@luxuryvillas.com',
      rating: 5,
      date: '1/5/2024',
      content: 'Guesty has been a game-changer for our luxury villa management. The interface is intuitive, and the automation features save us hours every day. The reporting tools are especially helpful for tracking performance across multiple properties.',
      category: 'Property Management',
      helpful: 32,
      notHelpful: 3,
      status: 'approved'
    },
    {
      id: '4',
      name: 'David Chen',
      email: 'david@urbanrentals.com',
      rating: 3,
      date: '1/3/2024',
      content: 'While the basic features work well, the pricing seems high for what you get. Customer support response times could be improved, and some features feel underdeveloped compared to competitors.',
      category: 'Pricing Tools',
      helpful: 12,
      notHelpful: 8,
      status: 'rejected'
    },
    {
      id: '5',
      name: 'Emily Watson',
      email: 'emily@vacationhomes.io',
      rating: 4,
      date: '12/28/2023',
      content: 'The cleaning management module is fantastic - it integrates well with our existing systems and the automated scheduling has reduced no-shows by 90%. The mobile app could use some improvements though.',
      category: 'Operations',
      helpful: 21,
      notHelpful: 4,
      status: 'pending'
    }
  ]);

  const approveReview = (id: string) => {
    setReviews(reviews.map(review => 
      review.id === id ? { ...review, status: 'approved' } : review
    ));
  };

  const rejectReview = (id: string) => {
    setReviews(reviews.map(review => 
      review.id === id ? { ...review, status: 'rejected' } : review
    ));
  };

  const deleteReview = (id: string) => {
    if (confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      setReviews(reviews.filter(review => review.id !== id));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'border-l-gray-800';
      case 'approved': return 'border-l-green-500';
      case 'rejected': return 'border-l-red-500';
      default: return 'border-l-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getActionButtons = (review: Review) => {
    if (review.status === 'pending') {
      return (
        <div className="flex gap-2">
          <button
            onClick={() => approveReview(review.id)}
            className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Approve
          </button>
          <button
            onClick={() => rejectReview(review.id)}
            className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            Reject
          </button>
        </div>
      );
    } else {
      return (
        <div className="flex gap-2">
          {review.status === 'approved' && (
            <button
              onClick={() => rejectReview(review.id)}
              className="px-4 py-2 bg-yellow-500 text-white text-sm font-medium rounded-lg hover:bg-yellow-600 transition-colors flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Mark as Rejected
            </button>
          )}
          {review.status === 'rejected' && (
            <button
              onClick={() => approveReview(review.id)}
              className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Mark as Approved
            </button>
          )}
          <button
            onClick={() => deleteReview(review.id)}
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 border border-gray-300"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      );
    }
  };

  const pendingReviews = reviews.filter(r => r.status === 'pending');
  const approvedReviews = reviews.filter(r => r.status === 'approved');
  const rejectedReviews = reviews.filter(r => r.status === 'rejected');
  
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Reviews</p>
              <p className="text-3xl font-semibold text-gray-900">{reviews.length}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Moderation</p>
              <p className="text-3xl font-semibold text-gray-900">{pendingReviews.length}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Average Rating</p>
              <div className="flex items-center gap-2">
                <p className="text-3xl font-semibold text-gray-900">{averageRating}</p>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < Math.floor(parseFloat(averageRating)) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Approved Reviews</p>
              <p className="text-3xl font-semibold text-gray-900">{approvedReviews.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Review Moderation Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Review Moderation</h2>
          <div className="flex gap-2">
            <span className="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded-lg">
              Total: {reviews.length}
            </span>
            <span className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-lg">
              Pending: {pendingReviews.length}
            </span>
            <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-lg">
              Approved: {approvedReviews.length}
            </span>
            <span className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-lg">
              Rejected: {rejectedReviews.length}
            </span>
          </div>
        </div>
        
        <div className="space-y-6">
          {reviews.map((review) => (
            <div 
              key={review.id} 
              className={`rounded-lg shadow-md border border-gray-200 overflow-hidden ${getStatusColor(review.status)} border-l-4`}
            >
              <div className="p-6">
                {/* Review Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-900">{review.name}</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                        Verified
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(review.status)}`}>
                        {getStatusText(review.status)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <span className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                        <span className="ml-1">{review.rating}/5</span>
                      </span>
                      <span>•</span>
                      <span>{review.date}</span>
                    </div>
                    
                    <p className="text-sm italic text-gray-600">{review.content.substring(0, 80)}...</p>
                  </div>
                  
                  <div className="flex-shrink-0">
                    {getActionButtons(review)}
                  </div>
                </div>

                {/* Full Review Content */}
                <p className="text-gray-700 mb-6">{review.content}</p>

                {/* Review Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600">Email:</span>
                      <span className="text-gray-900 font-medium truncate">{review.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600">Category:</span>
                      <span className="text-gray-900 font-medium">{review.category}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 font-medium">+{review.helpful}</span>
                      <span className="text-gray-600">Helpful</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-red-600 font-medium">-{review.notHelpful}</span>
                      <span className="text-gray-600">Not Helpful</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}