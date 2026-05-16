package com.shopjoy.ecadminapi.base.ec.st.service;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StErpVoucherLineDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StErpVoucherLine;
import com.shopjoy.ecadminapi.base.ec.st.repository.StErpVoucherLineRepository;
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
public class StErpVoucherLineService {

    private final StErpVoucherLineRepository stErpVoucherLineRepository;

    @PersistenceContext
    private EntityManager em;

    /* ERP 전표 상세 키조회 */
    public StErpVoucherLineDto.Item getById(String id) {
        StErpVoucherLineDto.Item dto = stErpVoucherLineRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public StErpVoucherLineDto.Item getByIdOrNull(String id) {
        return stErpVoucherLineRepository.selectById(id).orElse(null);
    }

    /* ERP 전표 상세 상세조회 */
    public StErpVoucherLine findById(String id) {
        return stErpVoucherLineRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public StErpVoucherLine findByIdOrNull(String id) {
        return stErpVoucherLineRepository.findById(id).orElse(null);
    }

    /* ERP 전표 상세 키검증 */
    public boolean existsById(String id) {
        return stErpVoucherLineRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!stErpVoucherLineRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* ERP 전표 상세 목록조회 */
    public List<StErpVoucherLineDto.Item> getList(StErpVoucherLineDto.Request req) {
        return stErpVoucherLineRepository.selectList(req);
    }

    /* ERP 전표 상세 페이지조회 */
    public StErpVoucherLineDto.PageResponse getPageData(StErpVoucherLineDto.Request req) {
        PageHelper.addPaging(req);
        return stErpVoucherLineRepository.selectPageList(req);
    }

    /* ERP 전표 상세 등록 */
    @Transactional
    public StErpVoucherLine create(StErpVoucherLine body) {
        body.setErpVoucherLineId(CmUtil.generateId("st_erp_voucher_line"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        StErpVoucherLine saved = stErpVoucherLineRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* ERP 전표 상세 저장 */
    @Transactional
    public StErpVoucherLine save(StErpVoucherLine entity) {
        if (!existsById(entity.getErpVoucherLineId()))
            throw new CmBizException("존재하지 않는 StErpVoucherLine입니다: " + entity.getErpVoucherLineId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StErpVoucherLine saved = stErpVoucherLineRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* ERP 전표 상세 수정 */
    @Transactional
    public StErpVoucherLine update(String id, StErpVoucherLine body) {
        StErpVoucherLine entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "erpVoucherLineId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StErpVoucherLine saved = stErpVoucherLineRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* ERP 전표 상세 수정 */
    @Transactional
    public StErpVoucherLine updateSelective(StErpVoucherLine entity) {
        if (entity.getErpVoucherLineId() == null) throw new CmBizException("erpVoucherLineId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getErpVoucherLineId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getErpVoucherLineId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = stErpVoucherLineRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* ERP 전표 상세 삭제 */
    @Transactional
    public void delete(String id) {
        StErpVoucherLine entity = findById(id);
        stErpVoucherLineRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* ERP 전표 상세 목록저장 */
    @Transactional
    public void saveList(List<StErpVoucherLine> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getErpVoucherLineId() != null)
            .map(StErpVoucherLine::getErpVoucherLineId)
            .toList();
        if (!deleteIds.isEmpty()) {
            stErpVoucherLineRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<StErpVoucherLine> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getErpVoucherLineId() != null)
            .toList();
        for (StErpVoucherLine row : updateRows) {
            StErpVoucherLine entity = findById(row.getErpVoucherLineId());
            VoUtil.voCopyExclude(row, entity, "erpVoucherLineId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            stErpVoucherLineRepository.save(entity);
        }
        em.flush();

        List<StErpVoucherLine> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (StErpVoucherLine row : insertRows) {
            row.setErpVoucherLineId(CmUtil.generateId("st_erp_voucher_line"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            stErpVoucherLineRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
