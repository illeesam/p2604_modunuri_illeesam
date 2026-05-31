package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmGiftCondDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGiftCond;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmGiftCondRepository;
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
public class PmGiftCondService {

    private final PmGiftCondRepository pmGiftCondRepository;

    @PersistenceContext
    private EntityManager em;

    /* 사은품 지급 조건 키조회 */
    public PmGiftCondDto.Item getById(String id) {
        PmGiftCondDto.Item dto = pmGiftCondRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmGiftCondDto.Item getByIdOrNull(String id) {
        return pmGiftCondRepository.selectById(id).orElse(null);
    }

    /* 사은품 지급 조건 상세조회 */
    public PmGiftCond findById(String id) {
        return pmGiftCondRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmGiftCond findByIdOrNull(String id) {
        return pmGiftCondRepository.findById(id).orElse(null);
    }

    /* 사은품 지급 조건 키검증 */
    public boolean existsById(String id) {
        return pmGiftCondRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pmGiftCondRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 사은품 지급 조건 목록조회 */
    public List<PmGiftCondDto.Item> getList(PmGiftCondDto.Request req) {
        return pmGiftCondRepository.selectList(req);
    }

    /* 사은품 지급 조건 페이지조회 */
    public PmGiftCondDto.PageResponse getPageData(PmGiftCondDto.Request req) {
        PageHelper.addPaging(req);
        return pmGiftCondRepository.selectPageData(req);
    }

    /* 사은품 지급 조건 등록 */
    @Transactional
    public PmGiftCond create(PmGiftCond body) {
        body.setGiftCondId(CmUtil.generateId("pm_gift_cond"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmGiftCond saved = pmGiftCondRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 사은품 지급 조건 수정 */
    @Transactional
    public PmGiftCond update(String id, PmGiftCond body) {
        CmUtil.requireId(id, "id", this);
        PmGiftCond entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "giftCondId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmGiftCond saved = pmGiftCondRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 사은품 지급 조건 수정 */
    @Transactional
    public PmGiftCond updateSelective(PmGiftCond entity) {
        if (entity.getGiftCondId() == null) throw new CmBizException("giftCondId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getGiftCondId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getGiftCondId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pmGiftCondRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 사은품 지급 조건 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        PmGiftCond entity = findById(id);
        pmGiftCondRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public PmGiftCond save(String cmd, PmGiftCond entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getGiftCondId() == null || entity.getGiftCondId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getGiftCondId() == null)
                    throw new CmBizException("삭제 대상 giftCondId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!pmGiftCondRepository.existsById(entity.getGiftCondId()))
                    throw new CmBizException("존재하지 않는 PmGiftCond입니다: " + entity.getGiftCondId() + "::" + CmUtil.svcCallerInfo(this));
                pmGiftCondRepository.deleteById(entity.getGiftCondId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setGiftCondId(CmUtil.generateId("pm_gift_cond"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                PmGiftCond saved = pmGiftCondRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getGiftCondId() == null)
                    throw new CmBizException("수정 대상 giftCondId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = pmGiftCondRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 PmGiftCond입니다: " + entity.getGiftCondId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getGiftCondId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<PmGiftCond> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (PmGiftCond row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getGiftCondId() == null || row.getGiftCondId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, PmGiftCond::getGiftCondId, "U", "giftCondId", this);
            CmUtil.requireRowIds(rows, PmGiftCond::getGiftCondId, "D", "giftCondId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(PmGiftCond::getGiftCondId)
                .toList();
            if (!deleteIds.isEmpty()) {
                pmGiftCondRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<PmGiftCond> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (PmGiftCond row : updateRows) {
                row.setUpdBy(authId);
                int affected = pmGiftCondRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getGiftCondId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<PmGiftCond> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (PmGiftCond row : insertRows) {
                row.setGiftCondId(CmUtil.generateId("pm_gift_cond"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pmGiftCondRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
}
