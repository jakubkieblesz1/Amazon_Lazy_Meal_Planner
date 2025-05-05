import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';

// Import the shared state
import { useGroceryStore } from './stores/groceryStore';

// Define grocery item interface
interface GroceryItem {
  category: string;
  name: string;
  quantity: string;
}

export default function GroceryPage() {
  // Get the state from our store
  const { hasGeneratedMeals, groceryList } = useGroceryStore();
  
  // Group groceries by category
  const groupedGroceries = React.useMemo(() => {
    const grouped: Record<string, GroceryItem[]> = {};
    
    groceryList.forEach(item => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });
    
    return grouped;
  }, [groceryList]);

  return (
    <View style={styles.container}>
      <View style={styles.upperContainer}>
        <Text style={styles.title}>Your grocery list</Text>
        <Text style={styles.subtitle}>Items to buy</Text>
        
        <ScrollView 
          style={styles.groceryListContainer}
          showsVerticalScrollIndicator={false}
        >
          {!hasGeneratedMeals ? (
            <View style={styles.emptyState}>
              <FontAwesome name="shopping-basket" size={60} color="#1A3A56" />
              <Text style={styles.emptyStateText}>Your grocery list is empty</Text>
              <Text style={styles.emptyStateSubtext}>Items from your recipes will appear here</Text>
            </View>
          ) : (
            <View style={styles.groceryList}>
              {Object.entries(groupedGroceries).map(([category, items]) => (
                <View key={category} style={styles.categorySection}>
                  <Text style={styles.categoryHeader}>{category}</Text>
                  {items.map((item, index) => (
                    <View key={`${item.name}-${index}`} style={styles.groceryItem}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemQuantity}>{item.quantity}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => router.push('/home')}
        >
          <MaterialIcons name="home-filled" size={28} color="#FFFFFF" />
          <Text style={styles.buttonLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton}>
          <FontAwesome name="shopping-cart" size={28} color="#FFFFFF" />
          <Text style={styles.buttonLabel}>Groceries</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton}
          onPress={() => router.push('/settings')}
        >
          <MaterialIcons name="settings" size={28} color="#FFFFFF" />
          <Text style={styles.buttonLabel}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09253F',
    height: '100%',
  },
  upperContainer: {
    flex: 1,
    backgroundColor: '#09253F',
    paddingHorizontal: 30,
    marginTop: -20,
  },
  title: {
    fontSize: 34,
    fontWeight: '500',
    color: '#FFFFFF',
    marginTop: '30%',
  },
  subtitle: {
    fontSize: 34,
    fontWeight: '500',
    color: '#7B7B7B',
    marginTop: 0,
    marginBottom: 20,
  },
  groceryListContainer: {
    flex: 1,
    marginTop: 10,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 200,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#FFFFFF',
    marginTop: 20,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#7B7B7B',
    marginTop: 10,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    height: 90,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#1A3A56',
  },
  navButton: {
    marginTop: 6,
    padding: 10,
    alignItems: 'center',
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  groceryList: {
    width: '100%',
    paddingTop: 10,
    marginBottom: 20,
  },
  groceryItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  categorySection: {
    marginBottom: 6,
  },
  categoryHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
});
