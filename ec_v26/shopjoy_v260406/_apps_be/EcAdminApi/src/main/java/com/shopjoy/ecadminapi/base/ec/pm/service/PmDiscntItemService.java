package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmDiscntItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscntItem;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmDiscntItemRepository;
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
public class PmDiscntItemService {

    private final PmDiscntItemRepository pmDiscntItemRepository;

    @PersistenceContext
    private EntityManager em;

    /* 할인 대상 상품 키조회 */
    public PmDiscntItemDto.Item getById(String id) {
        PmDiscntItemDto.Item dto = pmDiscntItemRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmDiscntItemDto.Item getByIdOrNull(String id) {
        return pmDiscntItemRepository.selectById(id).orElse(null);
    }

    /* 할인 대상 상품 상세조회 */
    public PmDiscntItem findById(String id) {
        return pmDiscntItemRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmDiscntItem findByIdOrNull(String id) {
        return pmDiscntItemRepository.findById(id).orElse(null);
    }

    /* 할인 대상 상품 키검증 */
    public boolean existsById(String id) {
        return pmDiscntItemRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pmDiscntItemRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 할인 대상 상품 목록조회 */
    public List<PmDiscntItemDto.Item> getList(PmDiscntItemDto.Request req) {
        return pmDiscntItemRepository.selectList(req);
    }

    /* 할인 대상 상품 페이지조회 */
    public PmDiscntItemDto.PageResponse getPageData(PmDiscntItemDto.Request req) {
        PageHelper.addPaging(req);
        return pmDiscntItemRepository.selectPageData(req);
    }

    /* 할인 대상 상품 등록 */
    @Transactional
    public PmDiscntItem create(PmDiscntItem body) {
        body.setDiscntItemId(CmUtil.generateId("pm_discnt_item"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmDiscntItem saved = pmDiscntItemRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 할인 대상 상품 수정 */
    @Transactional
    public PmDiscntItem update(String id, PmDiscntItem body) {
        CmUtil.requireId(id, "id", this);
        PmDiscntItem entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "discntItemId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmDiscntItem saved = pmDiscntItemRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 할인 대상 상품 수정 */
    @Transactional
    public PmDiscntItem updateSelective(PmDiscntItem entity) {
        if (entity.getDiscntItemId() == null) throw new CmBizException("discntItemId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getDiscntItemId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getDiscntItemId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pmDiscntItemRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 할인 대상 상품 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        PmDiscntItem entity = findById(id);
        pmDiscntItemRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public PmDiscntItem save(String cmd, PmDiscntItem entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getDiscntItemId() == null || entity.getDiscntItemId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getDiscntItemId() == null)
                    throw new CmBizException("삭제 대상 discntItemId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!pmDiscntItemRepository.existsById(entity.getDiscntItemId()))
                    throw new CmBizException("존재하지 않는 PmDiscntItem입니다: " + entity.getDiscntItemId() + "::" + CmUtil.svcCallerInfo(this));
                pmDiscntItemRepository.deleteById(entity.getDiscntItemId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setDiscntItemId(CmUtil.generateId("pm_discnt_item"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                PmDiscntItem saved = pmDiscntItemRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getDiscntItemId() == null)
                    throw new CmBizException("수정 대상 discntItemId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = pmDiscntItemRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 PmDiscntItem입니다: " + entity.getDiscntItemId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getDiscntItemId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<PmDiscntItem> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (PmDiscntItem row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getDiscntItemId() == null || row.getDiscntItemId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, PmDiscntItem::getDiscntItemId, "U", "discntItemId", this);
            CmUtil.requireRowIds(rows, PmDiscntItem::getDiscntItemId, "D", "discntItemId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(PmDiscntItem::getDiscntItemId)
                .toList();
            if (!deleteIds.isEmpty()) {
                pmDiscntItemRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<PmDiscntItem> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (PmDiscntItem row : updateRows) {
                row.setUpdBy(authId);
                int affected = pmDiscntItemRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getDiscntItemId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<PmDiscntItem> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (PmDiscntItem row : insertRows) {
                row.setDiscntItemId(CmUtil.generateId("pm_discnt_item"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pmDiscntItemRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
}
