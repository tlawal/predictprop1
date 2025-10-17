'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '@clerk/nextjs';
import useSWR from 'swr';
import { Trophy, Users, Calendar, DollarSign, Target, Crown, Medal, Award } from 'lucide-react';
import toast from 'react-hot-toast';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function CompetitionsPanel() {
  const { t } = useTranslation();
  const { user } = useUser();
  const [selectedCompetition, setSelectedCompetition] = useState(null);

  // Fetch competitions list
  const { data: competitions, error: competitionsError, isLoading: competitionsLoading, mutate: mutateCompetitions } = useSWR(
    '/api/competitions',
    fetcher,
    { refreshInterval: 60000 } // Refresh every minute
  );

  // Fetch selected competition details
  const { data: competitionDetails, error: detailsError, isLoading: detailsLoading } = useSWR(
    selectedCompetition ? `/api/competitions?competitionId=${selectedCompetition.id}&userId=${user?.id}` : null,
    fetcher
  );

  const handleJoinCompetition = async (competitionId) => {
    try {
      const response = await fetch('/api/competitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          competitionId,
          action: 'join'
        })
      });

      if (response.ok) {
        toast.success('Successfully joined competition!');
        mutateCompetitions(); // Refresh competitions list
        if (selectedCompetition?.id === competitionId) {
          setSelectedCompetition(null); // Close modal
        }
      } else {
        toast.error('Failed to join competition');
      }
    } catch (error) {
      toast.error('Error joining competition');
    }
  };

  const handleLeaveCompetition = async (competitionId) => {
    try {
      const response = await fetch('/api/competitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          competitionId,
          action: 'leave'
        })
      });

      if (response.ok) {
        toast.success('Successfully left competition');
        mutateCompetitions(); // Refresh competitions list
        if (selectedCompetition?.id === competitionId) {
          setSelectedCompetition(null); // Close modal
        }
      } else {
        toast.error('Failed to leave competition');
      }
    } catch (error) {
      toast.error('Error leaving competition');
    }
  };

  const getPositionIcon = (position) => {
    switch (position) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <Target className="w-5 h-5 text-slate-400" />;
    }
  };

  const getPositionColor = (position) => {
    switch (position) {
      case 1:
        return 'text-yellow-400';
      case 2:
        return 'text-gray-400';
      case 3:
        return 'text-amber-400';
      default:
        return 'text-slate-400';
    }
  };

  if (competitionsLoading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-700/50 rounded-2xl p-6">
                <div className="h-6 bg-slate-700 rounded w-3/4 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-700 rounded"></div>
                  <div className="h-4 bg-slate-700 rounded w-4/5"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (competitionsError) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8">
        <div className="text-center">
          <p className="text-red-400">Failed to load competitions</p>
          <button
            onClick={() => mutateCompetitions()}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
        <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
          <Trophy className="w-6 h-6" />
          Trading Competitions
        </h3>
        <p className="text-slate-400">
          Compete with other traders for prizes and glory. Join active competitions to start earning points!
        </p>
      </div>

      {/* Competitions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {competitions?.map((competition) => (
          <div
            key={competition.id}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 hover:border-slate-600 transition-colors cursor-pointer"
            onClick={() => setSelectedCompetition(competition)}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-white mb-1">{competition.title}</h4>
                <p className="text-slate-400 text-sm line-clamp-2">{competition.description}</p>
              </div>
              <div className="text-right">
                <div className="text-yellow-400 font-bold text-lg">{competition.prizePool}</div>
                <div className="text-slate-400 text-xs">Prize Pool</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-slate-400">
                  <Users className="w-4 h-4" />
                  <span>{competition.participants || 0}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-400">
                  <Calendar className="w-4 h-4" />
                  <span>{competition.daysLeft || 0}d left</span>
                </div>
              </div>
              <div className={`px-2 py-1 rounded text-xs font-medium ${
                competition.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'
              }`}>
                {competition.status}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Competition Details Modal */}
      {selectedCompetition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">{selectedCompetition.title}</h3>
                <button
                  onClick={() => setSelectedCompetition(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Competition Info */}
              <div>
                <p className="text-slate-300 mb-4">{selectedCompetition.description}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-yellow-400 font-bold text-xl">{selectedCompetition.prizePool}</div>
                    <div className="text-slate-400 text-sm">Prize Pool</div>
                  </div>
                  <div className="text-center">
                    <div className="text-blue-400 font-bold text-xl">{selectedCompetition.participants || 0}</div>
                    <div className="text-slate-400 text-sm">Participants</div>
                  </div>
                  <div className="text-center">
                    <div className="text-green-400 font-bold text-xl">{selectedCompetition.daysLeft || 0}</div>
                    <div className="text-slate-400 text-sm">Days Left</div>
                  </div>
                  <div className="text-center">
                    <div className={`font-bold text-xl ${
                      selectedCompetition.status === 'active' ? 'text-green-400' : 'text-slate-400'
                    }`}>
                      {selectedCompetition.status}
                    </div>
                    <div className="text-slate-400 text-sm">Status</div>
                  </div>
                </div>
              </div>

              {/* Rules */}
              {selectedCompetition.rules && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">Competition Rules</h4>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-slate-300 text-sm leading-relaxed">{selectedCompetition.rules}</p>
                  </div>
                </div>
              )}

              {/* Prizes */}
              {selectedCompetition.prizes && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">Prize Structure</h4>
                  <div className="space-y-3">
                    {selectedCompetition.prizes.map((prize, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {getPositionIcon(prize.position)}
                          <div>
                            <div className={`font-medium ${getPositionColor(prize.position)}`}>
                              {prize.position === 1 ? '1st' : prize.position === 2 ? '2nd' : prize.position === 3 ? '3rd' : `${prize.position}th`} Place
                            </div>
                            <div className="text-slate-400 text-sm">{prize.description}</div>
                          </div>
                        </div>
                        <div className="text-yellow-400 font-bold text-lg">{prize.prize}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Leaderboard Preview */}
              {competitionDetails?.leaderboard && competitionDetails.leaderboard.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">Current Leaderboard</h4>
                  <div className="bg-slate-800/50 rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-slate-700">
                      <div className="grid grid-cols-4 gap-4 text-sm font-medium text-slate-400">
                        <div>Rank</div>
                        <div>Trader</div>
                        <div>P&L</div>
                        <div>Trades</div>
                      </div>
                    </div>
                    <div className="divide-y divide-slate-700">
                      {competitionDetails.leaderboard.slice(0, 5).map((entry) => (
                        <div key={entry.rank} className="p-4">
                          <div className="grid grid-cols-4 gap-4 items-center">
                            <div className="flex items-center gap-2">
                              {getPositionIcon(entry.rank)}
                              <span className={`font-medium ${getPositionColor(entry.rank)}`}>
                                #{entry.rank}
                              </span>
                            </div>
                            <div className="text-white font-medium truncate">
                              {entry.username || entry.user?.email?.split('@')[0] || 'Anonymous'}
                            </div>
                            <div className={`font-medium ${entry.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              ${entry.pnl?.toFixed(2) || '0.00'}
                            </div>
                            <div className="text-slate-400">{entry.trades || 0}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Join/Leave Button */}
              <div className="flex justify-end pt-4 border-t border-slate-700">
                {competitionDetails?.isJoined ? (
                  <button
                    onClick={() => handleLeaveCompetition(selectedCompetition.id)}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Leave Competition
                  </button>
                ) : (
                  <button
                    onClick={() => handleJoinCompetition(selectedCompetition.id)}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Join Competition
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
