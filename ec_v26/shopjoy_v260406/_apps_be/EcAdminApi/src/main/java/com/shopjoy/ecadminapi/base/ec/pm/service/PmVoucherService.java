package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmVoucherDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmVoucher;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmVoucherRepository;
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
public class PmVoucherService {

    private final PmVoucherRepository pmVoucherRepository;

    @PersistenceContext
    private EntityManager em;

    public PmVoucherDto.Item getById(String id) {
        PmVoucherDto.Item dto = pmVoucherRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmVoucherDto.Item getByIdOrNull(String id) {
        return pmVoucherRepository.selectById(id).orElse(null);
    }

    public PmVoucher findById(String id) {
        return pmVoucherRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmVoucher findByIdOrNull(String id) {
        return pmVoucherRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return pmVoucherRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pmVoucherRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<PmVoucherDto.Item> getList(PmVoucherDto.Request req) {
        return pmVoucherRepository.selectList(req);
    }

    public PmVoucherDto.PageResponse getPageData(PmVoucherDto.Request req) {
        PageHelper.addPaging(req);
        return pmVoucherRepository.selectPageList(req);
    }

    @Transactional
    public PmVoucher create(PmVoucher body) {
        body.setVoucherId(CmUtil.generateId("pm_voucher"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmVoucher saved = pmVoucherRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PmVoucher save(PmVoucher entity) {
        if (!existsById(entity.getVoucherId()))
            throw new CmBizException("존재하지 않는 PmVoucher입니다: " + entity.getVoucherId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmVoucher saved = pmVoucherRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PmVoucher update(String id, PmVoucher body) {
        PmVoucher entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "voucherId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmVoucher saved = pmVoucherRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PmVoucher updateSelective(PmVoucher entity) {
        if (entity.getVoucherId() == null) throw new CmBizException("voucherId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getVoucherId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getVoucherId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pmVoucherRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        PmVoucher entity = findById(id);
        pmVoucherRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveList(List<PmVoucher> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getVoucherId() != null)
            .map(PmVoucher::getVoucherId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pmVoucherRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<PmVoucher> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getVoucherId() != null)
            .toList();
        for (PmVoucher row : updateRows) {
            PmVoucher entity = findById(row.getVoucherId());
            VoUtil.voCopyExclude(row, entity, "voucherId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pmVoucherRepository.save(entity);
        }
        em.flush();

        List<PmVoucher> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PmVoucher row : insertRows) {
            row.setVoucherId(CmUtil.generateId("pm_voucher"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pmVoucherRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
