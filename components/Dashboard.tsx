
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions 
} from 'react-native';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { UserProfile, Transaction } from '../types';
import { FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface Props {
  user: UserProfile;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export default function Dashboard({ user, theme, toggleTheme }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const isDark = theme === 'dark';

  useEffect(() => {
    const q = query(collection(db, "transactions"), where("uid", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs: Transaction[] = [];
      snapshot.forEach((doc) => txs.push({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(txs);
    });
    return () => unsubscribe();
  }, [user.uid]);

  const summary = transactions.reduce((acc, curr) => {
    const amt = Number(curr.amount) || 0;
    if (curr.type === 'income') acc.balance += amt;
    else acc.balance -= amt;
    return acc;
  }, { balance: 0 });

  const handleDelete = async (id: string) => {
    if (confirm("Deseja excluir este registro?")) {
      await deleteDoc(doc(db, "transactions", id));
    }
  };

  return (
    <View style={[styles.container, isDark && styles.darkBg]}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Text style={[styles.welcome, isDark && styles.lightText]}>Olá, {user.displayName?.split(' ')[0]}</Text>
          <Text style={styles.brand}>Ecooy Portal</Text>
        </View>
        <TouchableOpacity onPress={toggleTheme} style={styles.themeBtn}>
          <FontAwesome5 name={isDark ? "sun" : "moon"} size={18} color={isDark ? "#fbbf24" : "#64748b"} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>SALDO DISPONÍVEL</Text>
          <Text style={styles.balanceValue}>R$ {summary.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
          <View style={styles.cardDecoration} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, isDark && styles.lightText]}>Transações Recentes</Text>
          <TouchableOpacity><Text style={styles.seeAll}>Ver tudo</Text></TouchableOpacity>
        </View>

        <View style={styles.list}>
          {transactions.map(tx => (
            <View key={tx.id} style={[styles.txItem, isDark && styles.darkItem]}>
              <View style={[styles.txIcon, tx.type === 'income' ? styles.incomeIcon : styles.expenseIcon]}>
                <FontAwesome5 name={tx.type === 'income' ? 'arrow-up' : 'arrow-down'} size={12} color="white" />
              </View>
              <View style={styles.txInfo}>
                <Text style={[styles.txName, isDark && styles.lightText]}>{tx.description}</Text>
                <Text style={[styles.txAmount, tx.type === 'income' ? styles.incomeText : styles.expenseText]}>
                  R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </Text>
                <Text style={styles.txCategory}>{tx.category}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(tx.id)} style={styles.deleteBtn}>
                <FontAwesome5 name="trash-alt" size={14} color="#f43f5e" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.tabBar, isDark && styles.darkTabBar]}>
        <TabItem icon="home" label="Início" active />
        <TabItem icon="receipt" label="Extrato" />
        <TouchableOpacity style={styles.fab}>
          <FontAwesome5 name="plus" size={20} color="white" />
        </TouchableOpacity>
        <TabItem icon="bullseye" label="Metas" />
        <TabItem icon="user" label="Perfil" />
      </View>
    </View>
  );
}

const TabItem = ({ icon, label, active = false }: any) => (
  <TouchableOpacity style={styles.tabItem}>
    <FontAwesome5 name={icon} size={20} color={active ? '#4f46e5' : '#94a3b8'} />
    <Text style={[styles.tabLabel, active && styles.activeTabLabel]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  darkBg: { backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 12 },
  userInfo: { gap: 2 },
  welcome: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
  brand: { fontSize: 10, fontWeight: '900', color: '#6366f1', letterSpacing: 2, textTransform: 'uppercase' },
  themeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 24, paddingBottom: 100 },
  balanceCard: { backgroundColor: '#4f46e5', borderRadius: 32, padding: 32, overflow: 'hidden', marginBottom: 32 },
  balanceLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  balanceValue: { color: 'white', fontSize: 36, fontWeight: '900', marginTop: 8 },
  cardDecoration: { position: 'absolute', right: -20, top: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.1)' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
  seeAll: { color: '#6366f1', fontSize: 12, fontWeight: '800' },
  list: { gap: 12 },
  txItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 20, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  darkItem: { backgroundColor: '#1e293b' },
  txIcon: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  incomeIcon: { backgroundColor: '#10b981' },
  expenseIcon: { backgroundColor: '#f43f5e' },
  txInfo: { flex: 1, marginLeft: 16 },
  txName: { fontSize: 15, fontWeight: '800', color: '#334155' },
  txAmount: { fontSize: 17, fontWeight: '900', marginTop: 4 },
  incomeText: { color: '#10b981' },
  expenseText: { color: '#334155' },
  txCategory: { fontSize: 10, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginTop: 2 },
  deleteBtn: { padding: 8 },
  tabBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 85, backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingHorizontal: 10 },
  darkTabBar: { backgroundColor: '#0f172a', borderTopColor: '#1e293b' },
  tabItem: { alignItems: 'center', gap: 4 },
  tabLabel: { fontSize: 9, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase' },
  activeTabLabel: { color: '#4f46e5' },
  fab: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center', marginTop: -40, shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  lightText: { color: 'white' }
});
