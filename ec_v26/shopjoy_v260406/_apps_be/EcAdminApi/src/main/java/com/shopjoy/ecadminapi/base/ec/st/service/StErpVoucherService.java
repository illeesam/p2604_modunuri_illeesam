package com.shopjoy.ecadminapi.base.ec.st.service;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StErpVoucherDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StErpVoucher;
import com.shopjoy.ecadminapi.base.ec.st.repository.StErpVoucherRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StErpVoucherService {

    private final StErpVoucherRepository stErpVoucherRepository;

    @PersistenceContext
    private EntityManager em;

    /* ERP 전표 키조회 */
    public StErpVoucherDto.Item getById(String id) {
        StErpVoucherDto.Item dto = stErpVoucherRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public StErpVoucherDto.Item getByIdOrNull(String id) {
        return stErpVoucherRepository.selectById(id).orElse(null);
    }

    /* ERP 전표 상세조회 */
    public StErpVoucher findById(String id) {
        return stErpVoucherRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public StErpVoucher findByIdOrNull(String id) {
        return stErpVoucherRepository.findById(id).orElse(null);
    }

    /* ERP 전표 키검증 */
    public boolean existsById(String id) {
        return stErpVoucherRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!stErpVoucherRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* ERP 전표 목록조회 */
    public List<StErpVoucherDto.Item> getList(StErpVoucherDto.Request req) {
        return stErpVoucherRepository.selectList(req);
    }

    /* ERP 전표 페이지조회 */
    public StErpVoucherDto.PageResponse getPageData(StErpVoucherDto.Request req) {
        PageHelper.addPaging(req);
        return stErpVoucherRepository.selectPageList(req);
    }

    /* ERP 전표 등록 */
    @Transactional
    public StErpVoucher create(StErpVoucher body) {
        body.setErpVoucherId(CmUtil.generateId("st_erp_voucher"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        StErpVoucher saved = stErpVoucherRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* ERP 전표 저장 */
    @Transactional
    public StErpVoucher save(StErpVoucher entity) {
        if (!existsById(entity.getErpVoucherId()))
            throw new CmBizException("존재하지 않는 StErpVoucher입니다: " + entity.getErpVoucherId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StErpVoucher saved = stErpVoucherRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* ERP 전표 수정 */
    @Transactional
    public StErpVoucher update(String id, StErpVoucher body) {
        StErpVoucher entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "erpVoucherId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StErpVoucher saved = stErpVoucherRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* ERP 전표 수정 */
    @Transactional
    public StErpVoucher updateSelective(StErpVoucher entity) {
        if (entity.getErpVoucherId() == null) throw new CmBizException("erpVoucherId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getErpVoucherId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getErpVoucherId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = stErpVoucherRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* ERP 전표 삭제 */
    @Transactional
    public void delete(String id) {
        StErpVoucher entity = findById(id);
        stErpVoucherRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* ERP 전표 목록저장 */
    @Transactional
    public void saveList(List<StErpVoucher> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getErpVoucherId() != null)
            .map(StErpVoucher::getErpVoucherId)
            .toList();
        if (!deleteIds.isEmpty()) {
            stErpVoucherRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<StErpVoucher> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getErpVoucherId() != null)
            .toList();
        for (StErpVoucher row : updateRows) {
            StErpVoucher entity = findById(row.getErpVoucherId());
            VoUtil.voCopyExclude(row, entity, "erpVoucherId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            stErpVoucherRepository.save(entity);
        }
        em.flush();

        List<StErpVoucher> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (StErpVoucher row : insertRows) {
            row.setErpVoucherId(CmUtil.generateId("st_erp_voucher"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            stErpVoucherRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
