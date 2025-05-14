package quiz_service.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScoreDistributionItemDto {
    private String label; // Örn: "Geçti", "Kaldı" veya skor aralığı "%0-20"
    private int value;    // Bu kategorideki öğrenci sayısı
}