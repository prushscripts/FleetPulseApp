import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  TextInput,
  Alert,
  Modal,
  StyleSheet,
  FlatList,
} from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { colors } from '@/constants/colors'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import AppHeader from '@/components/ui/AppHeader'
import { getCompanyId } from '@/lib/getCompanyId'

type Vehicle = {
  id: string
  code: string | null
  make: string | null
  model: string | null
  year: number | null
  status: string | null
  current_mileage: number | null
  oil_change_due_mileage: number | null
  location: string | null
  vin: string | null
  license_plate: string | null
  driver_id: string | null
  assigned_driver_id: string | null
  notes: string | null
}

type Driver = {
  id: string
  first_name: string
  last_name: string
  location: string | null
  user_id: string | null
  phone: string | null
  email: string | null
}

type Issue = {
  id: string
  title: string
  description: string | null
  priority: string
  status: string
  created_at: string
}

type ServiceRecord = {
  id: string
  type: string
  description: string | null
  cost: number | null
  mileage_at_service: number | null
  performed_at: string
  performed_by: string | null
}

type Tab = 'overview' | 'driver' | 'issues' | 'service'

export default function VehicleDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>()
  const id = Array.isArray(params.id) ? params.id[0] : params.id

  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [assignedDriver, setAssignedDriver] = useState<Driver | null>(null)
  const [allDrivers, setAllDrivers] = useState<Driver[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [companyId, setCompanyId] = useState<string | null>(null)

  const [showServiceModal, setShowServiceModal] = useState(false)
  const [serviceType, setServiceType] = useState('')
  const [serviceDesc, setServiceDesc] = useState('')
  const [serviceCost, setServiceCost] = useState('')
  const [serviceMileage, setServiceMileage] = useState('')
  const [serviceSaving, setServiceSaving] = useState(false)

  const [showAssignModal, setShowAssignModal] = useState(false)
  const [driverSearch, setDriverSearch] = useState('')

  const load = useCallback(async () => {
    if (!id) return
    try {
      const cid = await getCompanyId()
      console.log('Company ID resolved:', cid)
      setCompanyId(cid)

      const [vehicleRes, issuesRes, serviceRes, driversRes] = await Promise.all([
        supabase.from('vehicles').select('*').eq('id', id).single(),
        supabase
          .from('issues')
          .select('id, title, description, priority, status, created_at')
          .eq('vehicle_id', id)
          .neq('status', 'resolved')
          .order('created_at', { ascending: false }),
        supabase
          .from('service_records')
          .select('id, type, description, cost, mileage_at_service, performed_at, performed_by')
          .eq('vehicle_id', id)
          .order('performed_at', { ascending: false })
          .limit(10),
        cid
          ? supabase
              .from('drivers')
              .select('id, first_name, last_name, location, user_id, phone, email')
              .eq('company_id', cid)
              .eq('active', true)
              .order('first_name')
          : Promise.resolve({ data: null, error: null } as const),
      ])

      if (vehicleRes.error || !vehicleRes.data) {
        setVehicle(null)
        setIssues([])
        setServiceRecords([])
        setAllDrivers([])
        setAssignedDriver(null)
        return
      }

      const v = vehicleRes.data as Vehicle
      setVehicle(v)
      setIssues((issuesRes.data as Issue[]) ?? [])
      setServiceRecords((serviceRes.data as ServiceRecord[]) ?? [])
      const drList = (driversRes.data as Driver[]) ?? []
      setAllDrivers(drList)

      const driverId = v?.driver_id || v?.assigned_driver_id
      if (driverId && drList.length) {
        const d = drList.find((dr) => dr.id === driverId)
        setAssignedDriver(d ?? null)
      } else {
        setAssignedDriver(null)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const oilOverdue = vehicle
    ? (vehicle.current_mileage ?? 0) >= (vehicle.oil_change_due_mileage ?? Infinity)
    : false
  const overdueMiles =
    oilOverdue && vehicle
      ? (vehicle.current_mileage ?? 0) - (vehicle.oil_change_due_mileage ?? 0)
      : 0

  const handleLogService = async () => {
    if (!serviceType.trim() || !id) return
    setServiceSaving(true)
    try {
      const { error } = await supabase.from('service_records').insert({
        vehicle_id: id,
        company_id: companyId,
        type: serviceType.trim(),
        description: serviceDesc.trim() || null,
        cost: serviceCost ? parseFloat(serviceCost) : null,
        mileage_at_service: serviceMileage ? parseInt(serviceMileage, 10) : vehicle?.current_mileage,
        performed_at: new Date().toISOString(),
      })
      if (error) throw error
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setShowServiceModal(false)
      setServiceType('')
      setServiceDesc('')
      setServiceCost('')
      setServiceMileage('')
      await load()
    } catch {
      Alert.alert('Error', 'Could not save service record.')
    } finally {
      setServiceSaving(false)
    }
  }

  const handleAssignDriver = async (driver: Driver) => {
    if (!id) return
    try {
      const { error: vErr } = await supabase
        .from('vehicles')
        .update({ driver_id: driver.id, assigned_driver_id: driver.id })
        .eq('id', id)
      if (vErr) throw vErr
      const { error: dErr } = await supabase.from('drivers').update({ assigned_vehicle_id: id }).eq('id', driver.id)
      if (dErr) throw dErr
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setShowAssignModal(false)
      await load()
    } catch {
      Alert.alert('Error', 'Could not assign driver.')
    }
  }

  const handleUnassignDriver = async () => {
    if (!assignedDriver?.first_name) return
    Alert.alert('Unassign Driver', `Remove ${assignedDriver.first_name} from this vehicle?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unassign',
        style: 'destructive',
        onPress: async () => {
          if (!id || !assignedDriver) return
          try {
            const { error: vErr } = await supabase
              .from('vehicles')
              .update({ driver_id: null, assigned_driver_id: null })
              .eq('id', id)
            if (vErr) throw vErr
            const { error: dErr } = await supabase
              .from('drivers')
              .update({ assigned_vehicle_id: null })
              .eq('id', assignedDriver.id)
            if (dErr) throw dErr
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            await load()
          } catch {
            Alert.alert('Error', 'Could not unassign driver.')
          }
        },
      },
    ])
  }

  const filteredDrivers = allDrivers.filter((d) => {
    const q = driverSearch.toLowerCase()
    return `${d.first_name} ${d.last_name}`.toLowerCase().includes(q)
  })

  if (loading) {
    return (
      <View style={s.loader}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    )
  }

  if (!vehicle) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgBase }}>
        <StatusBar barStyle="light-content" />
        <AppHeader title="Vehicle" showBack />
        <View style={s.loader}>
          <Text style={{ color: colors.textMuted }}>Vehicle not found</Text>
        </View>
      </View>
    )
  }

  const TABS: { id: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: 'overview', label: 'Overview', icon: 'information-circle-outline' },
    { id: 'driver', label: 'Driver', icon: 'person-outline' },
    { id: 'issues', label: `Issues${issues.length > 0 ? ` (${issues.length})` : ''}`, icon: 'warning-outline' },
    { id: 'service', label: 'Service', icon: 'construct-outline' },
  ]

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />

      <AppHeader
        title={vehicle.code ?? 'Vehicle'}
        showBack
        subtitle={[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ') || undefined}
      />

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true)
              void load()
            }}
            tintColor={colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={s.heroCard}>
          <View style={s.heroTop}>
            <View style={s.truckIconWrap}>
              <Ionicons name="car" size={22} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.truckCode}>{vehicle.code ?? '—'}</Text>
              <Text style={s.truckSub}>{[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')}</Text>
            </View>
            <View style={[s.oilBadge, oilOverdue ? s.oilBadgeDanger : s.oilBadgeOk]}>
              <Text style={[s.oilBadgeText, { color: oilOverdue ? colors.danger : colors.success }]}>
                {oilOverdue ? `+${overdueMiles.toLocaleString()} mi` : 'Oil OK'}
              </Text>
            </View>
          </View>

          <View style={s.statsRow}>
            {[
              {
                label: 'Mileage',
                value: `${(vehicle.current_mileage ?? 0).toLocaleString()} mi`,
                color: colors.textPrimary,
              },
              {
                label: 'Oil Due',
                value: vehicle.oil_change_due_mileage
                  ? `${vehicle.oil_change_due_mileage.toLocaleString()} mi`
                  : '—',
                color: oilOverdue ? colors.danger : colors.textPrimary,
              },
              {
                label: 'Issues',
                value: String(issues.length),
                color: issues.length > 0 ? colors.warning : colors.success,
              },
            ].map((stat, i) => (
              <View key={stat.label} style={[s.statCell, i < 2 && s.statCellBorder]}>
                <Text style={[s.statValue, { color: stat.color }]}>{stat.value}</Text>
                <Text style={s.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.tabBar}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                setActiveTab(tab.id)
              }}
              style={[s.tab, activeTab === tab.id && s.tabActive]}
            >
              <Ionicons name={tab.icon} size={14} color={activeTab === tab.id ? 'white' : colors.textMuted} />
              <Text style={[s.tabText, activeTab === tab.id && s.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          {activeTab === 'overview' && (
            <View style={{ gap: 12 }}>
              <View style={s.card}>
                <Text style={s.cardTitle}>Vehicle Details</Text>
                {[
                  { label: 'Year', value: vehicle.year?.toString() ?? '—' },
                  { label: 'Make', value: vehicle.make ?? '—' },
                  { label: 'Model', value: vehicle.model ?? '—' },
                  { label: 'Location', value: vehicle.location ?? '—' },
                  { label: 'Status', value: vehicle.status ?? '—' },
                  { label: 'VIN', value: vehicle.vin ? `...${vehicle.vin.slice(-6)}` : '—' },
                  { label: 'Plate', value: vehicle.license_plate ?? '—' },
                ].map(({ label, value }) => (
                  <View key={label} style={s.detailRow}>
                    <Text style={s.detailLabel}>{label}</Text>
                    <Text style={s.detailValue}>{value}</Text>
                  </View>
                ))}
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity onPress={() => setShowServiceModal(true)} style={[s.actionBtn, { flex: 1 }]}>
                  <Ionicons name="construct-outline" size={16} color={colors.accent} />
                  <Text style={s.actionBtnText}>Log Service</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveTab('issues')} style={[s.actionBtn, { flex: 1 }]}>
                  <Ionicons name="warning-outline" size={16} color={colors.warning} />
                  <Text style={[s.actionBtnText, { color: colors.warning }]}>View Issues</Text>
                </TouchableOpacity>
              </View>

              {vehicle.notes ? (
                <View style={s.card}>
                  <Text style={s.cardTitle}>Notes</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20 }}>{vehicle.notes}</Text>
                </View>
              ) : null}
            </View>
          )}

          {activeTab === 'driver' && (
            <View style={{ gap: 12 }}>
              {assignedDriver ? (
                <View style={s.card}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <View style={s.driverAvatar}>
                      <Text style={s.driverAvatarText}>
                        {assignedDriver.first_name[0]}
                        {assignedDriver.last_name[0]}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.driverName}>
                        {assignedDriver.first_name} {assignedDriver.last_name}
                      </Text>
                      <Text style={s.driverSub}>{assignedDriver.location ?? 'Unknown location'}</Text>
                      {assignedDriver.phone ? <Text style={s.driverSub}>{assignedDriver.phone}</Text> : null}
                    </View>
                    <View style={[s.locationBadge]}>
                      <Text style={s.locationBadgeText}>{assignedDriver.location ?? '—'}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => void handleUnassignDriver()}
                    style={[s.actionBtn, { marginTop: 14, borderColor: 'rgba(239,68,68,0.3)' }]}
                  >
                    <Ionicons name="person-remove-outline" size={15} color={colors.danger} />
                    <Text style={[s.actionBtnText, { color: colors.danger }]}>Unassign Driver</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={s.card}>
                  <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                    <Ionicons name="person-outline" size={36} color={colors.textMuted} />
                    <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 10 }}>No driver assigned</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowAssignModal(true)}
                    style={[s.actionBtn, { borderColor: 'rgba(59,130,246,0.3)' }]}
                  >
                    <Ionicons name="person-add-outline" size={15} color={colors.accent} />
                    <Text style={s.actionBtnText}>Assign Driver</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {activeTab === 'issues' &&
            (issues.length === 0 ? (
              <View style={[s.card, { alignItems: 'center', paddingVertical: 32 }]}>
                <Ionicons name="checkmark-circle" size={36} color={colors.success} />
                <Text style={{ color: colors.textMuted, marginTop: 10, fontSize: 14 }}>No open issues</Text>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {issues.map((issue) => (
                  <View key={issue.id} style={s.issueRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.issueTitle}>{issue.title}</Text>
                      {issue.description ? (
                        <Text style={s.issueDesc} numberOfLines={2}>
                          {issue.description}
                        </Text>
                      ) : null}
                      <Text style={s.issueDate}>{new Date(issue.created_at).toLocaleDateString()}</Text>
                    </View>
                    <View
                      style={[
                        s.priorityBadge,
                        {
                          backgroundColor:
                            issue.priority === 'critical'
                              ? 'rgba(239,68,68,0.12)'
                              : issue.priority === 'high'
                                ? 'rgba(245,158,11,0.12)'
                                : 'rgba(59,130,246,0.12)',
                          borderColor:
                            issue.priority === 'critical'
                              ? 'rgba(239,68,68,0.3)'
                              : issue.priority === 'high'
                                ? 'rgba(245,158,11,0.3)'
                                : 'rgba(59,130,246,0.3)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          s.priorityText,
                          {
                            color:
                              issue.priority === 'critical'
                                ? colors.danger
                                : issue.priority === 'high'
                                  ? colors.warning
                                  : colors.accent,
                          },
                        ]}
                      >
                        {issue.priority}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ))}

          {activeTab === 'service' && (
            <View style={{ gap: 8 }}>
              <TouchableOpacity onPress={() => setShowServiceModal(true)} style={[s.actionBtn, { marginBottom: 4 }]}>
                <Ionicons name="add-circle-outline" size={15} color={colors.accent} />
                <Text style={s.actionBtnText}>Log Service Record</Text>
              </TouchableOpacity>

              {serviceRecords.length === 0 ? (
                <View style={[s.card, { alignItems: 'center', paddingVertical: 32 }]}>
                  <Ionicons name="construct-outline" size={36} color={colors.textMuted} />
                  <Text style={{ color: colors.textMuted, marginTop: 10, fontSize: 14 }}>No service records</Text>
                </View>
              ) : (
                serviceRecords.map((rec) => (
                  <View key={rec.id} style={s.serviceRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.serviceType}>{rec.type}</Text>
                      {rec.description ? <Text style={s.serviceDesc}>{rec.description}</Text> : null}
                      <Text style={s.serviceDate}>
                        {new Date(rec.performed_at).toLocaleDateString()}
                        {rec.mileage_at_service ? ` · ${rec.mileage_at_service.toLocaleString()} mi` : ''}
                      </Text>
                    </View>
                    {rec.cost != null ? <Text style={s.serviceCost}>${rec.cost.toFixed(0)}</Text> : null}
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showServiceModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowServiceModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.bgBase, padding: 24 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24,
            }}
          >
            <Text style={{ color: 'white', fontSize: 20, fontWeight: '800' }}>Log Service</Text>
            <TouchableOpacity onPress={() => setShowServiceModal(false)}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {(
            [
              {
                label: 'Service Type *',
                value: serviceType,
                setter: setServiceType,
                placeholder: 'e.g. Oil Change',
                keyboard: 'default' as const,
              },
              {
                label: 'Description',
                value: serviceDesc,
                setter: setServiceDesc,
                placeholder: 'Optional notes',
                keyboard: 'default' as const,
              },
              {
                label: 'Cost ($)',
                value: serviceCost,
                setter: setServiceCost,
                placeholder: '0.00',
                keyboard: 'numeric' as const,
              },
              {
                label: 'Mileage at Service',
                value: serviceMileage,
                setter: setServiceMileage,
                placeholder: vehicle?.current_mileage?.toString() ?? '',
                keyboard: 'numeric' as const,
              },
            ] as const
          ).map((field) => (
            <View key={field.label} style={{ marginBottom: 16 }}>
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: 11,
                  fontWeight: '600',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  marginBottom: 7,
                }}
              >
                {field.label}
              </Text>
              <TextInput
                value={field.value}
                onChangeText={field.setter}
                placeholder={field.placeholder}
                placeholderTextColor={colors.textMuted}
                keyboardType={field.keyboard}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.09)',
                  borderRadius: 12,
                  color: 'white',
                  fontSize: 15,
                  padding: 14,
                }}
              />
            </View>
          ))}

          <TouchableOpacity
            onPress={() => void handleLogService()}
            disabled={!serviceType.trim() || serviceSaving}
            style={{
              backgroundColor: colors.accent,
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: 'center',
              opacity: !serviceType.trim() || serviceSaving ? 0.5 : 1,
              marginTop: 8,
            }}
          >
            {serviceSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: 'white', fontSize: 15, fontWeight: '700' }}>Save Record</Text>
            )}
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal
        visible={showAssignModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAssignModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.bgBase, padding: 24 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <Text style={{ color: 'white', fontSize: 20, fontWeight: '800' }}>Assign Driver</Text>
            <TouchableOpacity onPress={() => setShowAssignModal(false)}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <TextInput
            value={driverSearch}
            onChangeText={setDriverSearch}
            placeholder="Search drivers..."
            placeholderTextColor={colors.textMuted}
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.09)',
              borderRadius: 12,
              color: 'white',
              fontSize: 15,
              padding: 14,
              marginBottom: 16,
            }}
          />

          <FlatList
            data={filteredDrivers}
            keyExtractor={(d) => d.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => void handleAssignDriver(item)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 14,
                  borderRadius: 12,
                  marginBottom: 8,
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.07)',
                }}
              >
                <View style={[s.driverAvatar, { width: 36, height: 36, borderRadius: 18 }]}>
                  <Text style={[s.driverAvatarText, { fontSize: 12 }]}>
                    {item.first_name[0]}
                    {item.last_name[0]}
                  </Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                    {item.first_name} {item.last_name}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>{item.location ?? 'Unknown'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 20 }}>No drivers found</Text>
            }
          />
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBase },
  loader: { flex: 1, backgroundColor: colors.bgBase, alignItems: 'center', justifyContent: 'center' },
  heroCard: {
    margin: 16,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20,
    overflow: 'hidden',
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18 },
  truckIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(59,130,246,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  truckCode: { color: 'white', fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'] },
  truckSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  oilBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  oilBadgeDanger: { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.25)' },
  oilBadgeOk: { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.25)' },
  oilBadgeText: { fontSize: 11, fontWeight: '700' },
  statsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  statCell: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  statCellBorder: { borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.06)' },
  statValue: { fontSize: 16, fontWeight: '700', fontVariant: ['tabular-nums'] },
  statLabel: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tabBar: { marginTop: 4 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'transparent',
  },
  tabActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  tabText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: 'white' },
  card: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
    padding: 16,
  },
  cardTitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  detailLabel: { color: colors.textMuted, fontSize: 13 },
  detailValue: { color: 'white', fontSize: 13, fontWeight: '500' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.25)',
    backgroundColor: 'rgba(59,130,246,0.06)',
  },
  actionBtnText: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  driverAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(59,130,246,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverAvatarText: { color: colors.accent, fontSize: 15, fontWeight: '700' },
  driverName: { color: 'white', fontSize: 16, fontWeight: '700' },
  driverSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  locationBadge: {
    backgroundColor: 'rgba(59,130,246,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  locationBadgeText: { color: colors.accent, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  issueRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14,
  },
  issueTitle: { color: 'white', fontSize: 14, fontWeight: '600' },
  issueDesc: { color: colors.textMuted, fontSize: 12, marginTop: 3, lineHeight: 17 },
  issueDate: { color: colors.textMuted, fontSize: 11, marginTop: 5 },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 2,
  },
  priorityText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14,
  },
  serviceType: { color: 'white', fontSize: 14, fontWeight: '600' },
  serviceDesc: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  serviceDate: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  serviceCost: { color: colors.success, fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
})
