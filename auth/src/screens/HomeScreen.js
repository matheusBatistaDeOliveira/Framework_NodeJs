import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
  Alert,
} from 'react-native';

import { signOut } from 'firebase/auth';
import { ref, onValue, set, remove, update } from 'firebase/database';
import { auth, database } from '../config/firebase';

export default function HomeScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // NOVO: lista de usuários
  const [users, setUsers] = useState([]);

  // NOVO: usuário que está sendo alterado
  const [editingUser, setEditingUser] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingEmail, setEditingEmail] = useState('');
  const [editingAddress, setEditingAddress] = useState('');

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setIsLoadingUser(false);
      return;
    }

    const userRef = ref(database, `users/${uid}`);

    const unsubscribe = onValue(
      userRef,
      (snapshot) => {
        const data = snapshot.val() || {};

        setName(data.name || '');
        setEmail(data.email || auth.currentUser?.email || '');
        setAddress(data.address || '');
        setIsLoadingUser(false);
      },
      (error) => {
        alert(error.message);
        setIsLoadingUser(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // =========================================================
  // NOVO: CARREGAR LISTA DE USUÁRIOS
  // =========================================================

  useEffect(() => {
    const usersRef = ref(database, 'users');

    const unsubscribe = onValue(
      usersRef,
      (snapshot) => {
        const data = snapshot.val() || {};

        const usersList = Object.entries(data).map(
          ([uid, userData]) => ({
            uid,
            ...userData,
          })
        );

        setUsers(usersList);
      },
      (error) => {
        alert(error.message);
      }
    );

    return () => unsubscribe();
  }, []);

  const saveUserData = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      alert('Usuário não autenticado.');
      return;
    }

    setIsSaving(true);

    try {
      await set(ref(database, `users/${uid}`), {
        name,
        email: email || auth.currentUser?.email || '',
        address,
        updatedAt: new Date().toISOString(),
      });
      alert('Dados salvos com sucesso!');
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteUserData = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      alert('Usuário não autenticado.');
      return;
    }

    try {
      await remove(ref(database, `users/${uid}`));
      setName('');
      setEmail(auth.currentUser?.email || '');
      setAddress('');
      alert('Dados removidos com sucesso!');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSignOut = () => {
    signOut(auth)
      .then(() => navigation.replace('Login'))
      .catch(error => alert(error.message));
  };

  // =========================================================
  // NOVO: ALTERAR USUÁRIO DA LISTA
  // =========================================================

  const startEditingUser = (user) => {
    setEditingUser(user);
    setEditingName(user.name || '');
    setEditingEmail(user.email || '');
    setEditingAddress(user.address || '');
  };

  const cancelEditingUser = () => {
    setEditingUser(null);
    setEditingName('');
    setEditingEmail('');
    setEditingAddress('');
  };

  const saveEditedUser = async () => {
    if (!editingUser) return;

    try {
      await update(
        ref(database, `users/${editingUser.uid}`),
        {
          name: editingName,
          email: editingEmail,
          address: editingAddress,
          updatedAt: new Date().toISOString(),
        }
      );

      alert('Usuário alterado com sucesso!');
      cancelEditingUser();
    } catch (error) {
      alert(error.message);
    }
  };

  // =========================================================
  // NOVO: EXCLUIR USUÁRIO DA LISTA
  // =========================================================

  const deleteListedUser = (user) => {
    Alert.alert(
      'Excluir usuário',
      `Deseja realmente excluir os dados de ${
        user.name || user.email || 'este usuário'
      }?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await remove(
                ref(database, `users/${user.uid}`)
              );

              if (editingUser?.uid === user.uid) {
                cancelEditingUser();
              }

              alert('Usuário excluído com sucesso!');
            } catch (error) {
              alert(error.message);
            }
          },
        },
      ]
    );
  };

  // =========================================================
  // NOVO: ITEM DA LISTA
  // =========================================================

  const renderUser = ({ item }) => {
    return (
      <View style={styles.userCard}>
        <Text style={styles.userName}>
          {item.name || 'Nome não informado'}
        </Text>

        <Text style={styles.userInfo}>
          E-mail: {item.email || 'Não informado'}
        </Text>

        <Text style={styles.userInfo}>
          Endereço: {item.address || 'Não informado'}
        </Text>

        <View style={styles.userButtons}>
          <TouchableOpacity
            style={styles.smallEditButton}
            onPress={() => startEditingUser(item)}
          >
            <Text style={styles.smallButtonText}>
              Alterar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.smallDeleteButton}
            onPress={() => deleteListedUser(item)}
          >
            <Text style={styles.smallButtonText}>
              Excluir
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil do usuário</Text>

      <Text style={styles.text}>
        Olá, {auth.currentUser?.email}
      </Text>

      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Nome"
      />

      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="E-mail"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        value={address}
        onChangeText={setAddress}
        placeholder="Endereço"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={saveUserData}
        disabled={isLoadingUser || isSaving}
      >
        <Text style={styles.buttonText}>
          {isSaving ? 'Salvando...' : 'Salvar dados'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.buttonDanger]}
        onPress={deleteUserData}
      >
        <Text style={styles.buttonText}>
          Excluir dados
        </Text>
      </TouchableOpacity>

      {/* =====================================================
          NOVO: PAINEL DE ALTERAÇÃO
          ===================================================== */}

      {editingUser && (
        <View style={styles.editPanel}>
          <Text style={styles.editTitle}>
            Alterar usuário
          </Text>

          <TextInput
            style={styles.input}
            value={editingName}
            onChangeText={setEditingName}
            placeholder="Nome"
          />

          <TextInput
            style={styles.input}
            value={editingEmail}
            onChangeText={setEditingEmail}
            placeholder="E-mail"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            value={editingAddress}
            onChangeText={setEditingAddress}
            placeholder="Endereço"
          />

          <TouchableOpacity
            style={styles.button}
            onPress={saveEditedUser}
          >
            <Text style={styles.buttonText}>
              Salvar alteração
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={cancelEditingUser}
          >
            <Text style={styles.cancelButtonText}>
              Cancelar
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* =====================================================
          NOVO: LISTA DE USUÁRIOS ABAIXO DO PAINEL ORIGINAL
          ===================================================== */}

      <Text style={styles.listTitle}>
        Usuários cadastrados
      </Text>

      <FlatList
        data={users}
        keyExtractor={(item) => item.uid}
        renderItem={renderUser}
        style={styles.userList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Nenhum usuário cadastrado.
          </Text>
        }
      />

      {/* =====================================================
          SAIR — MANTIDO COMO ESTAVA
          ===================================================== */}

      <TouchableOpacity
        style={[styles.button, styles.buttonLogout]}
        onPress={handleSignOut}
      >
        <Text style={styles.buttonText}>
          Sair
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // =========================================================
  // ESTILOS ORIGINAIS — MANTIDOS
  // =========================================================

  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  text: {
    fontSize: 18,
    marginBottom: 20,
  },

  input: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 12,
  },

  button: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#0782F9',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },

  buttonDanger: {
    backgroundColor: '#d9534f',
  },

  buttonLogout: {
    backgroundColor: '#333',
  },

  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

  // =========================================================
  // NOVOS ESTILOS — SOMENTE DA LISTA
  // =========================================================

  listTitle: {
    width: '100%',
    maxWidth: 360,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 25,
    marginBottom: 10,
  },

  userList: {
    width: '100%',
    maxWidth: 360,
    flexGrow: 0,
    maxHeight: 250,
  },

  userCard: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 8,
  },

  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },

  userInfo: {
    fontSize: 13,
    color: '#555',
    marginBottom: 3,
  },

  userButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },

  smallEditButton: {
    backgroundColor: '#0782F9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginRight: 6,
  },

  smallDeleteButton: {
    backgroundColor: '#d9534f',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
  },

  smallButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  emptyText: {
    width: '100%',
    textAlign: 'center',
    color: '#777',
    padding: 15,
  },

  // =========================================================
  // PAINEL NOVO DE EDIÇÃO
  // =========================================================

  editPanel: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#0782F9',
  },

  editTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  cancelButton: {
    width: '100%',
    backgroundColor: '#eee',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },

  cancelButtonText: {
    color: '#333',
    fontWeight: '700',
    fontSize: 16,
  },
});
