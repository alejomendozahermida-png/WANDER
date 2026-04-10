import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/constants/theme';
import { fetchDeals, refreshDeals, Deal } from '../../src/services/dealsService';
import { useUserStore } from '../../src/store/userStore';

export default function DealsScreen() {
  const { user } = useUserStore();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'error_fares' | 'budget'>('all');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  const userAirport = user?.homeAirportIata || '';

  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = async () => {
    setLoading(true);
    try {
      await refreshDeals();
      const data = await fetchDeals(50, false, userAirport);
      setDeals(data);
    } catch (error) {
      console.error('Error loading deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshDeals();
      const data = await fetchDeals(50, false, userAirport);
      setDeals(data);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const filteredDeals = deals.filter(deal => {
    if (filter === 'error_fares') return deal.is_error_fare;
    if (filter === 'budget') return deal.price !== null && deal.price < 100;
    return true;
  });

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'secretflying': return 'airplane';
      case 'fly4free': return 'pricetag';
      case 'theflightdeal': return 'flash';
      case 'holidaypirates': return 'skull';
      default: return 'globe';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'secretflying': return '#FF6B6B';
      case 'fly4free': return '#4ECDC4';
      case 'theflightdeal': return '#FFE66D';
      case 'holidaypirates': return '#A8E6CF';
      default: return Colors.coral;
    }
  };

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Hace poco';
    if (hours < 24) return `Hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Hace ${days}d`;
  };

  const renderDeal = ({ item }: { item: Deal }) => (
    <TouchableOpacity
      style={styles.dealCard}
      onPress={() => setSelectedDeal(item)}
      activeOpacity={0.7}
    >
      {/* Image */}
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.dealImage} resizeMode="cover" />
      ) : (
        <View style={styles.dealImagePlaceholder}>
          <Ionicons name="airplane-outline" size={32} color={Colors.onSurfaceDim + '40'} />
        </View>
      )}

      <View style={styles.dealBody}>
        {/* Header row */}
        <View style={styles.dealHeaderRow}>
          <View style={[styles.sourcePill, { backgroundColor: getSourceColor(item.source) + '18' }]}>
            <Ionicons name={getSourceIcon(item.source) as any} size={12} color={getSourceColor(item.source)} />
            <Text style={[styles.sourceLabel, { color: getSourceColor(item.source) }]}>
              {item.source.replace('_', ' ')}
            </Text>
          </View>
          {item.is_error_fare && (
            <View style={styles.errorFarePill}>
              <Ionicons name="flash" size={10} color="#fff" />
              <Text style={styles.errorFareLabel}>Error Fare</Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={styles.dealTitle} numberOfLines={2}>{item.title}</Text>

        {/* Footer */}
        <View style={styles.dealFooter}>
          {item.price !== null ? (
            <Text style={styles.dealPrice}>
              {item.currency === 'EUR' ? '\u20ac' : '$'}{Math.round(item.price)}
            </Text>
          ) : <View />}
          <View style={styles.dealMeta}>
            {item.destination && (
              <View style={styles.metaChip}>
                <Ionicons name="location-outline" size={11} color={Colors.onSurfaceDim} />
                <Text style={styles.metaText}>{item.destination}</Text>
              </View>
            )}
            <Text style={styles.timeAgo}>{formatTimeAgo(item.published_at || item.fetched_at)}</Text>
          </View>
        </View>

        {/* Tags */}
        {item.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {item.tags.slice(0, 3).map((tag, i) => (
              <View key={i} style={styles.tagChip}>
                <Text style={styles.tagText}>{tag.replace('_', ' ')}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Ionicons name="flash" size={48} color={Colors.coral} />
          <Text style={styles.loadingTitle}>Buscando ofertas...</Text>
          <Text style={styles.loadingSubtext}>Escaneando feeds de vuelos baratos</Text>
          <ActivityIndicator size="small" color={Colors.coral} style={{ marginTop: 16 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Ofertas Flash</Text>
          <Text style={styles.headerSubtitle}>Error fares y vuelos baratos</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn} activeOpacity={0.6}>
          <Ionicons name="refresh" size={20} color={Colors.coral} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {[
          { key: 'all', label: 'Todas', icon: 'grid-outline' },
          { key: 'error_fares', label: 'Error Fares', icon: 'flash-outline' },
          { key: 'budget', label: '<100\u20ac', icon: 'wallet-outline' },
        ].map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
            onPress={() => setFilter(f.key as any)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={f.icon as any}
              size={14}
              color={filter === f.key ? '#fff' : Colors.onSurfaceDim}
            />
            <Text style={[styles.filterTabText, filter === f.key && styles.filterTabTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={styles.filterCount}>
          <Text style={styles.filterCountText}>{filteredDeals.length}</Text>
        </View>
      </View>

      <FlatList
        data={filteredDeals}
        renderItem={renderDeal}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.coral} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="airplane-outline" size={56} color={Colors.onSurfaceDim + '50'} />
            <Text style={styles.emptyTitle}>Sin ofertas disponibles</Text>
            <Text style={styles.emptySubtext}>Tira hacia abajo para actualizar</Text>
          </View>
        }
      />

      {/* Deal Detail Modal */}
      <Modal
        visible={!!selectedDeal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedDeal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setSelectedDeal(null)}
            >
              <Ionicons name="close" size={22} color={Colors.onSurface} />
            </TouchableOpacity>

            {selectedDeal && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {selectedDeal.image_url ? (
                  <Image
                    source={{ uri: selectedDeal.image_url }}
                    style={styles.modalImage}
                    resizeMode="cover"
                  />
                ) : null}

                <View style={styles.modalBody}>
                  <View style={[styles.sourcePill, { backgroundColor: getSourceColor(selectedDeal.source) + '18', marginBottom: Spacing.md }]}>
                    <Ionicons name={getSourceIcon(selectedDeal.source) as any} size={14} color={getSourceColor(selectedDeal.source)} />
                    <Text style={[styles.sourceLabel, { color: getSourceColor(selectedDeal.source) }]}>
                      {selectedDeal.source.replace('_', ' ')}
                    </Text>
                  </View>

                  <Text style={styles.modalTitle}>{selectedDeal.title}</Text>

                  {selectedDeal.price !== null && (
                    <Text style={styles.modalPrice}>
                      {selectedDeal.currency === 'EUR' ? '\u20ac' : '$'}{Math.round(selectedDeal.price)}
                    </Text>
                  )}

                  {selectedDeal.destination && (
                    <View style={styles.modalInfoRow}>
                      <Ionicons name="location" size={18} color={Colors.coral} />
                      <Text style={styles.modalInfoText}>Destino: {selectedDeal.destination}</Text>
                    </View>
                  )}

                  {selectedDeal.origin && (
                    <View style={styles.modalInfoRow}>
                      <Ionicons name="airplane" size={18} color={Colors.teal} />
                      <Text style={styles.modalInfoText}>Origen: {selectedDeal.origin}</Text>
                    </View>
                  )}

                  {selectedDeal.is_error_fare && (
                    <View style={styles.modalWarning}>
                      <Ionicons name="flash" size={18} color="#FF9800" />
                      <Text style={styles.modalWarningText}>
                        Error Fare - Estos precios pueden desaparecer rapidamente. Reserva cuanto antes si te interesa.
                      </Text>
                    </View>
                  )}

                  {selectedDeal.tags.length > 0 && (
                    <View style={[styles.tagsRow, { marginTop: Spacing.md }]}>
                      {selectedDeal.tags.map((tag, i) => (
                        <View key={i} style={styles.tagChip}>
                          <Text style={styles.tagText}>{tag.replace('_', ' ')}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={styles.modalHintCard}>
                    <Ionicons name="information-circle-outline" size={18} color={Colors.onSurfaceDim} />
                    <Text style={styles.modalHintText}>
                      Busca este vuelo en Skyscanner o Google Flights para reservar.
                    </Text>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.onSurface,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.onSurfaceDim,
    marginTop: 2,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,77,77,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Filters
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: 8,
    alignItems: 'center',
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    gap: 5,
    borderWidth: 1,
    borderColor: Colors.surfaceMid,
  },
  filterTabActive: {
    backgroundColor: Colors.coral,
    borderColor: Colors.coral,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurfaceDim,
  },
  filterTabTextActive: {
    color: '#fff',
  },
  filterCount: {
    backgroundColor: Colors.surfaceMid,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 'auto',
  },
  filterCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurfaceDim,
  },

  // List
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
    paddingTop: 4,
  },

  // Deal Card
  dealCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  dealImage: {
    width: '100%',
    height: 140,
    backgroundColor: Colors.surfaceMid,
  },
  dealImagePlaceholder: {
    width: '100%',
    height: 80,
    backgroundColor: Colors.surfaceMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dealBody: {
    padding: Spacing.md,
  },
  dealHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sourcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  sourceLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  errorFarePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 3,
  },
  errorFareLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  dealTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.onSurface,
    lineHeight: 21,
    marginBottom: 10,
  },
  dealFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dealPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.coral,
  },
  dealMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    color: Colors.onSurfaceDim,
    fontWeight: '500',
  },
  timeAgo: {
    fontSize: 11,
    color: Colors.onSurfaceDim,
    opacity: 0.6,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tagChip: {
    backgroundColor: 'rgba(255,77,77,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 10,
    color: Colors.coral,
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loadingTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.onSurface,
    marginTop: 8,
  },
  loadingSubtext: {
    fontSize: 13,
    color: Colors.onSurfaceDim,
  },

  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.onSurfaceDim,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.onSurfaceDim,
    opacity: 0.6,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 40,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.surfaceMid,
    alignSelf: 'center',
    marginTop: 10,
  },
  modalClose: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImage: {
    width: '100%',
    height: 200,
  },
  modalBody: {
    padding: Spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  modalPrice: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.coral,
    marginBottom: Spacing.lg,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  modalInfoText: {
    fontSize: 15,
    color: Colors.onSurface,
  },
  modalWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255, 152, 0, 0.08)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.15)',
  },
  modalWarningText: {
    flex: 1,
    fontSize: 13,
    color: Colors.onSurface,
    lineHeight: 19,
  },
  modalHintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.xl,
  },
  modalHintText: {
    flex: 1,
    fontSize: 13,
    color: Colors.onSurfaceDim,
    lineHeight: 19,
  },
});
