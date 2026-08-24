import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { quarteiraoService } from '../../services/api';
import { addProducaoLocal } from '../../services/producaoLocal';

const ProducaoInicio: React.FC = () => {
  const [quarteiroes, setQuarteiroes] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [cultura, setCultura] = useState('');
  const [safra, setSafra] = useState('');
  const [areaPlantada, setAreaPlantada] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [valor, setValor] = useState('');

  useEffect(() => {
    quarteiraoService.list()
      .then(setQuarteiroes)
      .catch(error => Alert.alert('Produção', error?.message || 'Não foi possível carregar os quarteirões.'));
  }, []);

  const save = async () => {
    if (!selected || !cultura.trim() || !safra.trim()) {
      Alert.alert('Produção', 'Selecione um quarteirão e informe cultura e safra.');
      return;
    }

    await addProducaoLocal({
      quarteiraoId: Number(selected.id_quadra),
      quarteiraoNome: selected.nome_quadra || selected.nome || `Quarteirão ${selected.id_quadra}`,
      cultura: cultura.trim(),
      safra: safra.trim(),
      areaPlantada,
      quantidade,
      valor,
    });

    setCultura('');
    setSafra('');
    setAreaPlantada('');
    setQuantidade('');
    setValor('');
    Alert.alert('Produção', 'Registro salvo localmente e marcado como pendente de sincronização.');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Registrar produção</Text>
      <Text style={styles.subtitle}>Vincule a atividade a um quarteirão cadastrado.</Text>
      <Text style={styles.label}>Quarteirão</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.options}>
        {quarteiroes.map(quarteirao => (
          <TouchableOpacity
            key={quarteirao.id_quadra}
            onPress={() => setSelected(quarteirao)}
            style={[styles.option, selected?.id_quadra === quarteirao.id_quadra && styles.optionSelected]}
          >
            <Text style={[styles.optionText, selected?.id_quadra === quarteirao.id_quadra && styles.optionTextSelected]}>
              {quarteirao.nome_quadra || quarteirao.nome || `#${quarteirao.id_quadra}`}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TextInput style={styles.input} placeholder="Cultura" value={cultura} onChangeText={setCultura} />
      <TextInput style={styles.input} placeholder="Safra" value={safra} onChangeText={setSafra} />
      <TextInput style={styles.input} placeholder="Área plantada" keyboardType="decimal-pad" value={areaPlantada} onChangeText={setAreaPlantada} />
      <TextInput style={styles.input} placeholder="Quantidade colhida" keyboardType="decimal-pad" value={quantidade} onChangeText={setQuantidade} />
      <TextInput style={styles.input} placeholder="Resultado financeiro" keyboardType="decimal-pad" value={valor} onChangeText={setValor} />
      <TouchableOpacity style={styles.button} onPress={save}>
        <Text style={styles.buttonText}>Salvar produção</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#F5F5F7', flexGrow: 1 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#17343B', marginBottom: 6 },
  subtitle: { color: '#4A5568', marginBottom: 20 },
  label: { fontWeight: '700', color: '#17343B', marginBottom: 8 },
  options: { gap: 8, paddingBottom: 18 },
  option: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#D7E2DF', backgroundColor: '#FFFFFF' },
  optionSelected: { backgroundColor: '#176B68', borderColor: '#176B68' },
  optionText: { color: '#17343B', fontWeight: '600' },
  optionTextSelected: { color: '#FFFFFF' },
  input: { minHeight: 46, backgroundColor: '#FFFFFF', borderColor: '#D7E2DF', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginBottom: 12 },
  button: { minHeight: 46, borderRadius: 8, backgroundColor: '#176B68', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  buttonText: { color: '#FFFFFF', fontWeight: '700' },
});

export default ProducaoInicio;
