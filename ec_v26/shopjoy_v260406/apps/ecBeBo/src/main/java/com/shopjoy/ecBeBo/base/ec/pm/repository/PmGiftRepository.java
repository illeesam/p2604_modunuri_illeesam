package com.shopjoy.ecadminapi.base.ec.pm.repository;

import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGift;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmGiftRepository;

import java.util.List;

public interface PmGiftRepository extends JpaRepository<PmGift, String>, QPmGiftRepository {

    /** 상태 자동 동기화 배치 대상 */
    List<PmGift> findByUseYnAndGiftStatusCd(String useYn, String giftStatusCd);
}
