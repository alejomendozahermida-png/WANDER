import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../src/constants/theme';
import { fetchDeals, refreshDeals, Deal } from '../../src/services/dealsService';

export default function DealsScreen() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'error_fares' | 'budget'>('all');

  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = async () => {
    setLoading(true);
    try {
      // First refresh from RSS feeds
      await refreshDeals();
      const data = await fetchDeals(50);
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
      const data = await fetchDeals(50);
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
      onPress={() => item.url && Linking.openURL(item.url)}
      activeOpacity={0.7}
    >
      <View style={styles.dealHeader}>
        <View style={[styles.sourceBadge, { backgroundColor: getSourceColor(item.source) + '20' }]}>
          <Ionicons name={getSourceIcon(item.source) as any} size={14} color={getSourceColor(item.source)} />
          <Text style={[styles.sourceText, { color: getSourceColor(item.source) }]}>
            {item.source.replace('_', ' ')}
          </Text>
        </View>
        {item.is_error_fare && (
          <View style={styles.errorFareBadge}>
            <Ionicons name="flash" size={12} color="#fff" />
            <Text style={styles.errorFareText}>Error Fare</Text>
          </View>
        )}
      </View>

      <Text style={styles.dealTitle} numberOfLines={3}>{item.title}</Text>

      {/* Deal Image */}
      {item.image_url ? (
        <Image
          source={{ uri: item.image_url }}
          style={styles.dealImage}
          resizeMode="cover"
        />
      ) : null}

      <View style={styles.dealFooter}>
        {item.price !== null && (
          <Text style={styles.dealPrice}>
            {item.currency === 'EUR' ? '\u20ac' : '$'}{Math.round(item.price)}
          </Text>
        )}
        <View style={styles.dealMeta}>
          {item.destination && (
            <View style={styles.metaChip}>
              <Ionicons name="location-outline" size={12} color={Colors.onSurfaceDim} />
              <Text style={styles.metaText}>{item.destination}</Text>
            </View>
          )}
          <Text style={styles.timeAgo}>{formatTimeAgo(item.published_at || item.fetched_at)}</Text>
        </View>
      </View>

      {item.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {item.tags.map((tag, i) => (
            <View key={i} style={styles.tagChip}>
              <Text style={styles.tagText}>{tag.replace('_', ' ')}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.coral} />
          <Text style={styles.loadingText}>Buscando ofertas...</Text>
          <Text style={styles.loadingSubtext}>Escaneando feeds de vuelos baratos</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ofertas Flash</Text>
        <Text style={styles.headerSubtitle}>Error fares y vuelos baratos en tiempo real</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {[
          { key: 'all', label: 'Todas', icon: 'grid-outline' },
          { key: 'error_fares', label: 'Error Fares', icon: 'flash-outline' },
          { key: 'budget', label: 'Menos de 100\u20ac', icon: 'wallet-outline' },
        ].map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
            onPress={() => setFilter(f.key as any)}
          >
            <Ionicons
              name={f.icon as any}
              size={16}
              color={filter === f.key ? '#fff' : Colors.onSurfaceDim}
            />
            <Text style={[styles.filterTabText, filter === f.key && styles.filterTabTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
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
            <Ionicons name="airplane-outline" size={48} color={Colors.onSurfaceDim} />
            <Text style={styles.emptyText}>No hay ofertas disponibles</Text>
            <Text style={styles.emptySubtext}>Tira hacia abajo para actualizar</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.onSurface,
  },
  headerSubtitle: {
    ...Typography.body,
    color: Colors.onSurfaceDim,
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.surfaceHigh,
    gap: 4,
  },
  filterTabActive: {
    backgroundColor: Colors.coral,
  },
  filterTabText: {
    fontSize: 12,
    color: Colors.onSurfaceDim,
  },
  filterTabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  dealCard: {
    backgroundColor: Colors.surfaceHigh,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  dealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  sourceText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  errorFareBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 3,
  },
  errorFareText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  dealTitle: {
    ...Typography.body,
    color: Colors.onSurface,
    fontWeight: '500',
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  dealImage: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surfaceMid,
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
    gap: Spacing.sm,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 12,
    color: Colors.onSurfaceDim,
  },
  timeAgo: {
    fontSize: 12,
    color: Colors.onSurfaceDim,
    opacity: 0.7,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: Spacing.sm,
  },
  tagChip: {
    backgroundColor: Colors.coral + '15',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.onSurfaceDim,
    marginTop: Spacing.lg,
  },
  loadingSubtext: {
    fontSize: 12,
    color: Colors.onSurfaceDim,
    marginTop: Spacing.sm,
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.onSurfaceDim,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: 12,
    color: Colors.onSurfaceDim,
    marginTop: Spacing.xs,
    opacity: 0.7,
  },
});
