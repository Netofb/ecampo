import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { Ionicons } from '@expo/vector-icons';


type Props = {
  visible: boolean;
  onClose: () => void;
  pushedSuccess: number;
  pulled: number;
  pushedConflicts: number;
  pushedErrors: number;
};

export default function SyncResultModal({
    
  visible,
  onClose,
  pushedSuccess,
  pulled,
  pushedConflicts,
  pushedErrors,
}: Props) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.55)",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: "800", marginBottom: 10 }}>
            Sincronização concluída
          </Text>

          <View style={{ gap: 10 }}>
  
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
               <Ionicons name="checkmark-circle" size={18} color="#4CAF50" style={{ marginRight: 8 }} />
                <Text>
                {' '}Enviados: <Text style={{ fontWeight: "700" }}>{pushedSuccess}</Text>
                </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="download-outline" size={18} color="#1c5cf1" style={{ marginRight: 8 }} />
                <Text>
                Baixados: <Text style={{ fontWeight: "800" }}>{pulled}</Text>
                </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="warning-outline" size={16} color="#e12020" style={{ marginRight: 8 }} />
                <Text>
                Conflitos: <Text style={{ fontWeight: "700" }}>{pushedConflicts}</Text>
                </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="close-circle-outline" size={16} color="#B45309" style={{ marginRight: 8 }} />
              <Text>
              Erros: <Text style={{ fontWeight: "700" }}>{pushedErrors}</Text>
              </Text>
            </View>

            </View>

          <Pressable
            onPress={onClose}
            style={{
              marginTop: 14,
              paddingVertical: 12,
              borderRadius: 12,
              alignItems: "center",
              backgroundColor: '#4CAF50',
            }}
          >
            <Text style={{ fontWeight: "800", color: '#fff', fontSize: 15 }}>OK</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
