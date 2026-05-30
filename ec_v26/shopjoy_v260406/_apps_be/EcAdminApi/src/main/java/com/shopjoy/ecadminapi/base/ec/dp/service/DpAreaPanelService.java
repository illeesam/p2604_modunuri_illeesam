package com.shopjoy.ecadminapi.base.ec.dp.service;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpAreaPanelDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpAreaPanel;
import com.shopjoy.ecadminapi.base.ec.dp.repository.DpAreaPanelRepository;
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
public class DpAreaPanelService {

    private final DpAreaPanelRepository dpAreaPanelRepository;

    @PersistenceContext
    private EntityManager em;

    /* 전시 영역-패널 매핑 키조회 */
    public DpAreaPanelDto.Item getById(String id) {
        DpAreaPanelDto.Item dto = dpAreaPanelRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public DpAreaPanelDto.Item getByIdOrNull(String id) {
        return dpAreaPanelRepository.selectById(id).orElse(null);
    }

    /* 전시 영역-패널 매핑 상세조회 */
    public DpAreaPanel findById(String id) {
        return dpAreaPanelRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public DpAreaPanel findByIdOrNull(String id) {
        return dpAreaPanelRepository.findById(id).orElse(null);
    }

    /* 전시 영역-패널 매핑 키검증 */
    public boolean existsById(String id) {
        return dpAreaPanelRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!dpAreaPanelRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 전시 영역-패널 매핑 목록조회 */
    public List<DpAreaPanelDto.Item> getList(DpAreaPanelDto.Request req) {
        return dpAreaPanelRepository.selectList(req);
    }

    /* 전시 영역-패널 매핑 페이지조회 */
    public DpAreaPanelDto.PageResponse getPageData(DpAreaPanelDto.Request req) {
        PageHelper.addPaging(req);
        return dpAreaPanelRepository.selectPageList(req);
    }

    /* 전시 영역-패널 매핑 등록 */
    @Transactional
    public DpAreaPanel create(DpAreaPanel body) {
        body.setAreaPanelId(CmUtil.generateId("dp_area_panel"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        DpAreaPanel saved = dpAreaPanelRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 전시 영역-패널 매핑 수정 */
    @Transactional
    public DpAreaPanel update(String id, DpAreaPanel body) {
        CmUtil.requireId(id, "id", this);
        DpAreaPanel entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "areaPanelId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        DpAreaPanel saved = dpAreaPanelRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 전시 영역-패널 매핑 수정 */
    @Transactional
    public DpAreaPanel updateSelective(DpAreaPanel entity) {
        if (entity.getAreaPanelId() == null) throw new CmBizException("areaPanelId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getAreaPanelId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getAreaPanelId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = dpAreaPanelRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 전시 영역-패널 매핑 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        DpAreaPanel entity = findById(id);
        dpAreaPanelRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /** save — rowStatus(I/U/D/M) 단건 분기 처리. saveList 의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public DpAreaPanel save(String cmd, DpAreaPanel entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank — userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getAreaPanelId() == null || entity.getAreaPanelId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getAreaPanelId() == null)
                    throw new CmBizException("삭제 대상 areaPanelId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!dpAreaPanelRepository.existsById(entity.getAreaPanelId()))
                    throw new CmBizException("존재하지 않는 DpAreaPanel입니다: " + entity.getAreaPanelId() + "::" + CmUtil.svcCallerInfo(this));
                dpAreaPanelRepository.deleteById(entity.getAreaPanelId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setAreaPanelId(CmUtil.generateId("dp_area_panel"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                DpAreaPanel saved = dpAreaPanelRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getAreaPanelId() == null)
                    throw new CmBizException("수정 대상 areaPanelId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = dpAreaPanelRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 DpAreaPanel입니다: " + entity.getAreaPanelId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getAreaPanelId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList — 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<DpAreaPanel> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (DpAreaPanel row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getAreaPanelId() == null || row.getAreaPanelId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, DpAreaPanel::getAreaPanelId, "U", "areaPanelId", this);
            CmUtil.requireRowIds(rows, DpAreaPanel::getAreaPanelId, "D", "areaPanelId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(DpAreaPanel::getAreaPanelId)
                .toList();
            if (!deleteIds.isEmpty()) {
                dpAreaPanelRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<DpAreaPanel> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (DpAreaPanel row : updateRows) {
                row.setUpdBy(authId);
                int affected = dpAreaPanelRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getAreaPanelId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<DpAreaPanel> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (DpAreaPanel row : insertRows) {
                row.setAreaPanelId(CmUtil.generateId("dp_area_panel"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                dpAreaPanelRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
}
